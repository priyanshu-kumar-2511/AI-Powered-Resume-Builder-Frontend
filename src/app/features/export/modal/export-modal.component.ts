import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LivePreviewService } from '../../builder/services/live-preview.service';
import { BuilderStateService } from '../../builder/services/builder-state.service';


type Step = 'form' | 'exporting' | 'done' | 'error';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="em-backdrop" (click)="onBackdropClick($event)">
      <div class="em-modal" role="dialog" aria-modal="true" aria-label="Export resume">
        <div class="em-header">
          <div class="em-header-left">
            <div class="em-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h2 class="em-title">Export Resume</h2>
              <p class="em-subtitle">Choose a format and download your resume.</p>
            </div>
          </div>
          <button type="button" class="em-close" (click)="close.emit()" aria-label="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="em-body">
          @if (step === 'exporting') {
            <div class="em-progress">
              <div class="em-steps">
                @for (s of steps; track s.key; let last = $last) {
                  <div class="em-step" [class.done]="isStepDone(s.key)" [class.active]="currentStep === s.key">
                    <div class="em-step-dot">
                      @if (isStepDone(s.key)) {
                        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      } @else if (currentStep === s.key) {
                        <div class="em-spinner"></div>
                      } @else {
                        <div class="em-dot-inner"></div>
                      }
                    </div>
                    <span class="em-step-label">{{ s.label }}</span>
                    @if (!last) { <div class="em-step-line" [class.done]="isStepDone(s.key)"></div> }
                  </div>
                }
              </div>
              <div class="em-status-msg">
                @switch (currentStep) {
                  @case ('QUEUED') { <span>Preparing your resume...</span> }
                  @case ('PROCESSING') { <span>Generating PDF, please wait...</span> }
                  @case ('COMPLETED') { <span>PDF ready!</span> }
                }
              </div>
            </div>
          }

          @if (step === 'error') {
            <div class="em-progress">
              <div class="em-steps">
                @for (s of steps; track s.key; let last = $last) {
                  <div class="em-step" [class.done]="isStepDone(s.key)" [class.failed]="currentStep === s.key">
                    <div class="em-step-dot" [class.dot-fail]="currentStep === s.key">
                      @if (isStepDone(s.key)) {
                        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      } @else if (currentStep === s.key) {
                        <span>X</span>
                      } @else {
                        <div class="em-dot-inner"></div>
                      }
                    </div>
                    <span class="em-step-label">{{ s.label }}</span>
                    @if (!last) { <div class="em-step-line" [class.done]="isStepDone(s.key)"></div> }
                  </div>
                }
              </div>
              <div class="em-status-msg em-failed">{{ errorMsg || 'Export failed. Please try again.' }}</div>
              <button class="em-retry-btn" (click)="resetToForm()">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4"/>
                </svg>
                Try again
              </button>
            </div>
          }

          @if (step === 'done') {
            <div class="em-progress">
              <div class="em-steps">
                @for (s of steps; track s.key; let last = $last) {
                  <div class="em-step done">
                    <div class="em-step-dot">
                      <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span class="em-step-label">{{ s.label }}</span>
                    @if (!last) { <div class="em-step-line done"></div> }
                  </div>
                }
              </div>
              <div class="em-status-msg">Export complete!</div>
              <div class="em-complete-card">
                <div class="em-file-info">
                  <div class="em-file-icon">FILE</div>
                  <div>
                    <div class="em-file-name">resume_{{ resumeId }}.pdf</div>
                    <div class="em-file-hint">PDF downloaded to your device</div>
                  </div>
                </div>
              </div>
              <button class="em-another-btn" (click)="resetToForm()">Export again</button>
            </div>
          }

          @if (step === 'form') {
            <div class="em-format-desc">
              <div class="em-desc-row"><span class="em-desc-icon em-ok">✓</span> Best for sharing and printing</div>
              <div class="em-desc-row"><span class="em-desc-icon em-ok">✓</span> Formatting preserved — ATS-friendly output</div>
              <div class="em-desc-row"><span class="em-desc-icon em-ok">✓</span> Exports directly from your resume preview</div>
            </div>

            <button type="button" class="em-export-btn" [class.warning]="isOverA4" [disabled]="submitting" (click)="submitExport()">
              @if (submitting) {
                <div class="em-btn-spinner"></div> Preparing...
              } @else {
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {{ isOverA4 ? (confirmedOverHeight ? 'Export Anyway' : 'Continue to Export') : 'Export as PDF' }}
              }
            </button>

            @if (isOverA4 && !confirmedOverHeight) {
              <div class="em-a4-alert">
                <strong>⚠️ Page Limit Warning</strong>
                <p>Your resume exceeds A4 size. It may be split into 2 pages or cut off. Please confirm to proceed.</p>
                <label class="em-confirm-check">
                  <input type="checkbox" (change)="confirmedOverHeight = $any($event.target).checked">
                  I understand and want to proceed
                </label>
              </div>
            }

            @if (errorMsg) {
              <div class="em-error">{{ errorMsg }}</div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .em-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn 0.18s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .em-modal {
      width: 100%; max-width: 440px;
      background: #111520;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      overflow: hidden;
      animation: slideUp 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }

    .em-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 20px 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      gap: 12px;
    }
    .em-header-left { display: flex; align-items: center; gap: 12px; }
    .em-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: rgba(0,212,180,0.1); border: 1px solid rgba(0,212,180,0.2);
      display: grid; place-items: center; color: #00d4b4; flex-shrink: 0;
    }
    .em-title { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0 0 2px; }
    .em-subtitle { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin: 0; }
    .em-close {
      width: 30px; height: 30px; border-radius: 7px;
      display: grid; place-items: center;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.4); cursor: pointer;
      transition: all 0.15s; flex-shrink: 0;
    }
    .em-close:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.25); color: #ef4444; }

    .em-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
    .em-rate-info {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.72rem; color: rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.03); border-radius: 7px; padding: 8px 10px;
    }

    .em-tabs { display: flex; gap: 6px; }
    .em-tab {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 10px 8px; border-radius: 10px;
      background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.4); cursor: pointer; font-family: inherit;
      transition: all 0.2s; position: relative;
    }
    .em-tab:hover:not(.locked) { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); }
    .em-tab.active { background: rgba(0,212,180,0.08); border-color: rgba(0,212,180,0.35); color: #00d4b4; }
    .em-tab.locked { opacity: 0.6; cursor: default; }
    .em-tab-icon { font-size: 1rem; font-weight: 700; }
    .em-tab-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; }
    .em-lock {
      position: absolute; top: 5px; right: 5px;
      color: #eab308; background: rgba(234,179,8,0.15);
      border-radius: 4px; padding: 2px 3px;
      display: flex; align-items: center;
    }

    .em-format-desc { display: flex; flex-direction: column; gap: 5px; }
    .em-desc-row { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: rgba(255,255,255,0.5); }
    .em-desc-icon { font-size: 0.72rem; font-weight: 700; min-width: 18px; }
    .em-ok { color: #00d4b4; }

    .em-locked-content { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; }
    .em-lock-icon { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.14em; color: #eab308; }
    .em-lock-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.7); }
    .em-lock-desc { font-size: 0.75rem; color: rgba(255,255,255,0.35); }
    .em-upgrade-link { display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg,#00d4b4,#00b89c); color: #000; font-weight: 700; font-size: 0.78rem; padding: 8px 18px; border-radius: 8px; text-decoration: none; margin-top: 4px; }

    .em-export-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px; border-radius: 10px;
      background: linear-gradient(135deg,#00d4b4,#00b89c);
      color: #000; font-weight: 700; font-size: 0.88rem;
      border: none; cursor: pointer; font-family: inherit;
      transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
    }
    .em-export-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,212,180,0.35); }
    .em-export-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
    .em-btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.3); border-top-color: #000; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .em-error { font-size: 0.75rem; color: #fca5a5; text-align: center; }

    .em-progress { display: flex; flex-direction: column; gap: 0; }
    .em-steps { display: flex; align-items: flex-start; margin-bottom: 20px; }
    .em-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative; }
    .em-step-dot {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      display: grid; place-items: center;
      color: rgba(255,255,255,0.3); font-size: 0.7rem;
      transition: all 0.3s; flex-shrink: 0; z-index: 1;
    }
    .em-step.done .em-step-dot { background: rgba(0,212,180,0.15); border-color: #00d4b4; color: #00d4b4; }
    .em-step.active .em-step-dot { border-color: #00d4b4; background: rgba(0,212,180,0.08); box-shadow: 0 0 0 3px rgba(0,212,180,0.12); }
    .em-step.failed .em-step-dot, .em-step-dot.dot-fail { border-color: #ef4444; background: rgba(239,68,68,0.1); color: #ef4444; }
    .em-dot-inner { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); }
    .em-spinner { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; animation: spin 0.7s linear infinite; }
    .em-step-label { font-size: 0.65rem; color: rgba(255,255,255,0.35); text-align: center; white-space: nowrap; }
    .em-step.done .em-step-label, .em-step.active .em-step-label { color: rgba(255,255,255,0.7); }
    .em-step.failed .em-step-label { color: #fca5a5; }
    .em-step-line { position: absolute; top: 13px; left: 50%; right: -50%; height: 2px; background: rgba(255,255,255,0.08); z-index: 0; }
    .em-step-line.done { background: #00d4b4; }

    .em-status-msg { text-align: center; font-size: 0.8rem; color: rgba(255,255,255,0.55); margin-bottom: 16px; }
    .em-failed { color: #fca5a5; }

    .em-complete-card {
      background: rgba(0,212,180,0.06); border: 1px solid rgba(0,212,180,0.2);
      border-radius: 10px; padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 10px;
    }
    .em-file-info { display: flex; align-items: center; gap: 10px; }
    .em-file-icon {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #00d4b4;
      background: rgba(0,212,180,0.12);
      border: 1px solid rgba(0,212,180,0.2);
      padding: 6px 8px;
      border-radius: 8px;
    }
    .em-file-name { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .em-file-hint { font-size: 0.68rem; color: rgba(255,255,255,0.35); margin-top: 2px; }

    .em-another-btn { width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-size: 0.75rem; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .em-another-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
    .em-retry-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; font-size: 0.78rem; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .em-retry-btn:hover { background: rgba(239,68,68,0.14); }

    .em-a4-alert {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 10px;
      padding: 12px;
      margin-top: 10px;
    }
    .em-a4-alert strong { display: block; font-size: 0.8rem; color: #f59e0b; margin-bottom: 4px; }
    .em-a4-alert p { font-size: 0.72rem; color: rgba(255,255,255,0.5); margin: 0 0 10px; line-height: 1.4; }
    .em-confirm-check { display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: rgba(255,255,255,0.8); cursor: pointer; }
    .em-confirm-check input { width: 14px; height: 14px; cursor: pointer; }

    .em-export-btn.warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }
  `]
})
export class ExportModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resumeId!: number;
  @Output() close = new EventEmitter<void>();

  private livePreview = inject(LivePreviewService);
  private builderState = inject(BuilderStateService);
  private destroy$ = new Subject<void>();

  step: Step = 'form';
  submitting = false;
  errorMsg = '';
  currentStep = 'QUEUED';
  isOverA4 = false;
  confirmedOverHeight = false;

  readonly steps = [
    { key: 'QUEUED', label: 'Queued' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'COMPLETED', label: 'Complete' }
  ];

  private readonly order = ['QUEUED', 'PROCESSING', 'COMPLETED'];

  ngOnInit(): void {
    this.builderState.isOverA4Height$
      .pipe(takeUntil(this.destroy$))
      .subscribe(over => this.isOverA4 = over);
  }

  isStepDone(key: string): boolean {
    if (this.step === 'error') return false;
    const currentIndex = this.order.indexOf(this.currentStep);
    const targetIndex = this.order.indexOf(key);
    return currentIndex > targetIndex;
  }

  submitExport(): void {
    if (this.submitting) return;
    
    if (this.isOverA4 && !this.confirmedOverHeight) {
      // Just visually nudge the user to check the box
      return;
    }

    this.exportPdfClientSide();
  }


  private exportPdfClientSide(): void {
    this.submitting = true;
    this.step = 'exporting';
    this.currentStep = 'QUEUED';
    this.errorMsg = '';

    setTimeout(() => {
      try {
        this.currentStep = 'PROCESSING';
        const html = this.livePreview.getRenderedHtml();

        if (!html) {
          throw new Error('Could not read resume preview. Please ensure your resume is loaded.');
        }

        setTimeout(() => {
          try {
            this.printHtml(html);
            this.currentStep = 'COMPLETED';
            setTimeout(() => {
              this.step = 'done';
              this.submitting = false;
            }, 600);
          } catch (error: any) {
            this.step = 'error';
            this.submitting = false;
            this.errorMsg = error?.message ?? 'Print window was blocked. Please allow popups for this site.';
          }
        }, 800);
      } catch (error: any) {
        this.step = 'error';
        this.submitting = false;
        this.currentStep = 'PROCESSING';
        this.errorMsg = error?.message ?? 'Failed to read resume data.';
      }
    }, 500);
  }

  private printHtml(resumeHtml: string): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      throw new Error('Popup blocked — please allow popups for this site and try again.');
    }

    const printCss = `
      @page { size: A4; margin: 0; }
      @media print {
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        * { box-shadow: none !important; }
      }
    `;

    const finalHtml = resumeHtml.includes('</head>')
      ? resumeHtml.replace('</head>', `<style>${printCss}</style></head>`)
      : `<style>${printCss}</style>${resumeHtml}`;

    printWindow.document.open();
    printWindow.document.write(finalHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 300);
    };

    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
      }
    }, 1500);
  }

  resetToForm(): void {
    this.step = 'form';
    this.currentStep = 'QUEUED';
    this.submitting = false;
    this.errorMsg = '';
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('em-backdrop')) {
      this.close.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

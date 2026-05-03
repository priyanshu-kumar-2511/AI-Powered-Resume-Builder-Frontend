import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { ExportApiService } from '../services/export-api.service';
import { ExportJob } from '../../../shared/models/models';

@Component({
  selector: 'app-export-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ep-wrap">

      <!-- Step track -->
      <div class="ep-steps">
        @for (step of steps; track step.key) {
          <div class="ep-step" [class.done]="isStepDone(step.key)" [class.active]="isStepActive(step.key)" [class.failed]="job?.status === 'FAILED' && isStepActive(step.key)">
            <div class="ep-step-dot">
              @if (isStepDone(step.key)) {
                <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              } @else if (isStepActive(step.key) && job?.status !== 'FAILED') {
                <div class="ep-spinner"></div>
              } @else if (job?.status === 'FAILED' && isStepActive(step.key)) {
                <span>✕</span>
              } @else {
                <div class="ep-dot-inner"></div>
              }
            </div>
            <span class="ep-step-label">{{ step.label }}</span>
            @if (!$last) { <div class="ep-step-line" [class.done]="isStepDone(step.key)"></div> }
          </div>
        }
      </div>

      <!-- Status message -->
      <div class="ep-status-msg" [class.ep-failed]="job?.status === 'FAILED'">
        @switch (job?.status) {
          @case ('QUEUED')      { <span>⏳ Your resume is in the queue…</span> }
          @case ('PROCESSING')  { <span>⚙️ Generating your file, please wait…</span> }
          @case ('COMPLETED')   { <span>✅ Export complete!</span> }
          @case ('FAILED')      { <span>❌ Export failed. Please try again.</span> }
          @default              { <span>Initializing…</span> }
        }
      </div>

      <!-- COMPLETED: download -->
      @if (job?.status === 'COMPLETED') {
        <div class="ep-complete-card">
          <div class="ep-file-info">
            <div class="ep-file-icon">
              {{ job!.format === 'PDF' ? '📄' : job!.format === 'DOCX' ? '📝' : '📦' }}
            </div>
            <div>
              <div class="ep-file-name">resume_{{ job!.resumeId }}.{{ job!.format.toLowerCase() }}</div>
              @if (job!.fileSizeKb) {
                <div class="ep-file-size">{{ job!.fileSizeKb }} KB</div>
              }
            </div>
          </div>
          <button class="ep-download-btn" (click)="onDownload()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
        </div>
        <button class="ep-another-btn" (click)="retry.emit()">Export another format</button>
      }

      <!-- FAILED: retry -->
      @if (job?.status === 'FAILED') {
        <button class="ep-retry-btn" (click)="retry.emit()">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4"/>
          </svg>
          Try again
        </button>
      }
    </div>
  `,
  styles: [`
    .ep-wrap { padding: 8px 0 4px; }

    .ep-steps {
      display: flex; align-items: flex-start;
      gap: 0; margin-bottom: 20px;
    }
    .ep-step {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; flex: 1; position: relative;
    }
    .ep-step-dot {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      display: grid; place-items: center;
      color: rgba(255,255,255,0.3); font-size: 0.7rem;
      transition: all 0.3s; flex-shrink: 0; z-index: 1;
    }
    .ep-step.done .ep-step-dot {
      background: rgba(0,212,180,0.15); border-color: #00d4b4; color: #00d4b4;
    }
    .ep-step.active .ep-step-dot {
      border-color: #00d4b4; background: rgba(0,212,180,0.08);
      box-shadow: 0 0 0 3px rgba(0,212,180,0.12);
    }
    .ep-step.failed .ep-step-dot {
      border-color: #ef4444; background: rgba(239,68,68,0.1); color: #ef4444;
    }
    .ep-dot-inner { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); }
    .ep-spinner {
      width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ep-step-label {
      font-size: 0.65rem; color: rgba(255,255,255,0.35);
      text-align: center; white-space: nowrap;
      transition: color 0.3s;
    }
    .ep-step.done .ep-step-label,
    .ep-step.active .ep-step-label  { color: rgba(255,255,255,0.7); }
    .ep-step.failed .ep-step-label  { color: #fca5a5; }

    .ep-step-line {
      position: absolute; top: 13px; left: 50%; right: -50%;
      height: 2px; background: rgba(255,255,255,0.08); z-index: 0;
      transition: background 0.4s;
    }
    .ep-step-line.done { background: #00d4b4; }

    .ep-status-msg {
      text-align: center; font-size: 0.8rem;
      color: rgba(255,255,255,0.55); margin-bottom: 16px;
    }
    .ep-status-msg.ep-failed { color: #fca5a5; }

    .ep-complete-card {
      background: rgba(0,212,180,0.06); border: 1px solid rgba(0,212,180,0.2);
      border-radius: 10px; padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 10px;
    }
    .ep-file-info { display: flex; align-items: center; gap: 10px; }
    .ep-file-icon { font-size: 1.4rem; }
    .ep-file-name { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .ep-file-size { font-size: 0.68rem; color: rgba(255,255,255,0.35); margin-top: 2px; }

    .ep-download-btn {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg,#00d4b4,#00b89c);
      color: #000; font-weight: 700; font-size: 0.78rem;
      padding: 8px 14px; border-radius: 8px; border: none;
      cursor: pointer; white-space: nowrap; font-family: inherit;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ep-download-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,212,180,0.3); }

    .ep-another-btn {
      width: 100%; padding: 8px; border-radius: 8px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.4); font-size: 0.75rem; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .ep-another-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }

    .ep-retry-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 9px; border-radius: 8px;
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
      color: #fca5a5; font-size: 0.78rem; cursor: pointer; font-family: inherit;
      transition: all 0.2s;
    }
    .ep-retry-btn:hover { background: rgba(239,68,68,0.14); }
  `]
})
export class ExportProgressComponent implements OnInit, OnDestroy {
  @Input({ required: true }) initialJob!: ExportJob;
  @Output() retry = new EventEmitter<void>();

  private exportApi = inject(ExportApiService);
  private stop$     = new Subject<void>();

  job: ExportJob | null = null;

  readonly steps = [
    { key: 'QUEUED',     label: 'Queued'     },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'COMPLETED',  label: 'Complete'   }
  ];

  private readonly ORDER = ['QUEUED', 'PROCESSING', 'COMPLETED'];

  ngOnInit(): void {
    this.job = this.initialJob;

    if (this.job.status === 'COMPLETED' || this.job.status === 'FAILED') return;

    this.exportApi.pollJobStatus(this.job.jobId, this.stop$).subscribe({
      next: (updated) => {
        this.job = updated;
        if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
          this.stop$.next();
        }
      },
      error: () => this.stop$.next()
    });
  }

  ngOnDestroy(): void {
    this.stop$.next();
    this.stop$.complete();
  }

  isStepDone(key: string): boolean {
    if (!this.job) return false;
    if (this.job.status === 'FAILED') return false;
    const cur = this.ORDER.indexOf(this.job.status);
    const idx = this.ORDER.indexOf(key);
    return cur > idx;
  }

  isStepActive(key: string): boolean {
    if (!this.job) return false;
    if (this.job.status === 'FAILED') return key === 'PROCESSING';
    return this.job.status === key;
  }

  onDownload(): void {
    if (!this.job) return;
    this.exportApi.downloadFile(this.job.jobId, this.job.format, this.job.resumeId);
  }
}

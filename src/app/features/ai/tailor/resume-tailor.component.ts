import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PremiumLockComponent } from '../shared/premium-lock.component';

@Component({
  selector: 'app-resume-tailor',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumLockComponent],
  template: `
    @if (!isPremium) {
      <app-premium-lock message="Tailor your entire resume to a specific job description automatically." />
    } @else {
      <div class="tailor">
        <div class="ai-gen-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Resume Tailor
        </div>

        <textarea class="ai-textarea" placeholder="Paste the job description you're applying for…" [(ngModel)]="jobDescription" rows="5"></textarea>

        <button class="ai-btn" (click)="tailor()" [disabled]="loading || !jobDescription">
          @if (loading) {
            <div class="tailor-progress">
              <span class="ai-spinner"></span>
              <span>{{ progressLabel }}</span>
            </div>
          } @else {
            ✦ Tailor Entire Resume
          }
        </button>

        @if (error) { <p class="ai-error">{{ error }}</p> }

        @if (result) {
          <div class="tailor-result">
            <p class="tailor-summary">Resume tailored successfully! Changes highlighted below.</p>
            <pre class="tailor-content">{{ result }}</pre>
            <div class="tailor-actions">
              <button class="ai-accept" (click)="applyAll()">✓ Apply All Changes</button>
              <button class="ai-discard" (click)="result = ''">✕ Discard</button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .tailor { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .ai-textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; resize: vertical; transition: border-color 0.2s; }
    .ai-textarea:focus { border-color: rgba(0,212,180,0.4); }
    .ai-textarea::placeholder { color: rgba(255,255,255,0.3); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; min-height: 40px; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .tailor-progress { display: flex; align-items: center; gap: 8px; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .tailor-result { background: rgba(0,212,180,0.04); border: 1px solid rgba(0,212,180,0.15); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .tailor-summary { font-size: 0.78rem; color: #00d4b4; font-weight: 600; margin: 0; }
    .tailor-content { font-size: 0.76rem; color: rgba(255,255,255,0.75); line-height: 1.6; white-space: pre-wrap; font-family: inherit; margin: 0; max-height: 280px; overflow-y: auto; }
    .tailor-actions { display: flex; gap: 8px; }
    .ai-accept { flex: 1; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.75rem; font-weight: 600; padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-discard { background: transparent; border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.7); font-size: 0.75rem; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; }
  `]
})
export class ResumeTailorComponent {
  @Input({ required: true }) resumeId!: number;
  @Input() resumeContent = '';
  @Output() changesApplied = new EventEmitter<string>();

  private aiApi = inject(AiApiService);
  private auth  = inject(AuthService);

  jobDescription = '';
  result  = '';
  loading = false;
  error   = '';
  progressLabel = 'Analysing resume…';

  private readonly progressSteps = [
    'Analysing resume…',
    'Matching keywords…',
    'Rewriting sections…',
    'Finalising changes…'
  ];

  get isPremium(): boolean { return this.auth.getCurrentPlan() === 'PREMIUM'; }

  tailor(): void {
    this.loading = true;
    this.error   = '';
    this.result  = '';
    this.progressLabel = this.progressSteps[0];

    // Cycle through progress labels
    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, this.progressSteps.length - 1);
      this.progressLabel = this.progressSteps[step];
    }, 2500);

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.tailorResume({
      userId,
      resumeId: this.resumeId,
      existingContent: this.resumeContent,
      jobDescription: this.jobDescription
    }).subscribe({
      next: res => {
        clearInterval(interval);
        this.result  = res.content ?? '';
        this.loading = false;
      },
      error: err => {
        clearInterval(interval);
        this.error   = err?.error?.message ?? 'Failed to tailor resume.';
        this.loading = false;
      }
    });
  }

  applyAll(): void {
    this.changesApplied.emit(this.result);
    this.result = '';
  }
}

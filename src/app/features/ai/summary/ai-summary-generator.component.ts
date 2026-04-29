import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ai-summary-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-gen">
      <div class="ai-gen-header">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/></svg>
        AI Summary Generator
      </div>

      <div class="ai-gen-fields">
        <input class="ai-input" type="text" placeholder="Target job title" [(ngModel)]="jobTitle" />
        <input class="ai-input" type="number" placeholder="Years of experience" [(ngModel)]="yearsExp" min="0" max="50" />
      </div>

      <button class="ai-btn" (click)="generate()" [disabled]="loading || !jobTitle">
        @if (loading) {
          <span class="ai-spinner"></span> Generating…
        } @else {
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
          Generate Summary
        }
      </button>

      @if (error) {
        <p class="ai-error">{{ error }}</p>
      }

      @if (result) {
        <div class="ai-result">
          <p class="ai-result-text">{{ result }}</p>
          <div class="ai-result-actions">
            <button class="ai-accept" (click)="accept()">✓ Accept</button>
            <button class="ai-regen" (click)="generate()">↻ Regenerate</button>
            <button class="ai-discard" (click)="discard()">✕ Discard</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ai-gen { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .ai-gen-fields { display: flex; flex-direction: column; gap: 7px; }
    .ai-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; transition: border-color 0.2s; }
    .ai-input:focus { border-color: rgba(0,212,180,0.4); }
    .ai-input::placeholder { color: rgba(255,255,255,0.3); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .ai-result { background: rgba(255,255,255,0.03); border: 1px solid rgba(0,212,180,0.15); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .ai-result-text { font-size: 0.8rem; color: rgba(255,255,255,0.75); line-height: 1.6; margin: 0; }
    .ai-result-actions { display: flex; gap: 7px; }
    .ai-accept { flex: 1; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.75rem; font-weight: 600; padding: 6px; border-radius: 6px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .ai-accept:hover { background: rgba(0,212,180,0.22); }
    .ai-regen { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.75rem; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-discard { background: transparent; border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.7); font-size: 0.75rem; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; }
  `]
})
export class AiSummaryGeneratorComponent {
  @Input() resumeId!: number;
  @Output() summaryAccepted = new EventEmitter<string>();

  private aiApi = inject(AiApiService);
  private auth  = inject(AuthService);

  jobTitle  = '';
  yearsExp  = 0;
  result    = '';
  loading   = false;
  error     = '';

  generate(): void {
    if (!this.jobTitle.trim()) return;
    this.loading = true;
    this.error   = '';
    this.result  = '';

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.generateSummary({
      userId,
      resumeId: this.resumeId,
      targetJobTitle: this.jobTitle,
      existingContent: `Years of experience: ${this.yearsExp}`
    }).subscribe({
      next: res => {
        this.result  = res.content ?? '';
        this.loading = false;
      },
      error: err => {
        this.error   = err?.error?.message ?? 'AI generation failed. Please try again.';
        this.loading = false;
      }
    });
  }

  accept(): void {
    this.summaryAccepted.emit(this.result);
    this.result = '';
  }

  discard(): void {
    this.result = '';
  }
}

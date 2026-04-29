import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PremiumLockComponent } from '../shared/premium-lock.component';

@Component({
  selector: 'app-cover-letter-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumLockComponent],
  template: `
    @if (!isPremium) {
      <app-premium-lock message="Generate a personalised cover letter tailored to the job description." />
    } @else {
      <div class="cl-gen">
        <div class="ai-gen-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Cover Letter Generator
        </div>

        <textarea class="ai-textarea" placeholder="Paste the job description here…" [(ngModel)]="jobDescription" rows="5"></textarea>

        <button class="ai-btn" (click)="generate()" [disabled]="loading || !jobDescription">
          @if (loading) { <span class="ai-spinner"></span> Writing… }
          @else { ✦ Generate Cover Letter }
        </button>

        @if (error) { <p class="ai-error">{{ error }}</p> }

        @if (result) {
          <div class="cl-result">
            <pre class="cl-text">{{ result }}</pre>
            <div class="cl-actions">
              <button class="ai-accept" (click)="copyToClipboard()">📋 Copy</button>
              <button class="ai-regen" (click)="generate()">↻ Regenerate</button>
              <button class="ai-discard" (click)="result = ''">✕ Clear</button>
            </div>
            @if (copied) { <p class="copied-note">Copied to clipboard ✓</p> }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .cl-gen { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .ai-textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; resize: vertical; transition: border-color 0.2s; }
    .ai-textarea:focus { border-color: rgba(0,212,180,0.4); }
    .ai-textarea::placeholder { color: rgba(255,255,255,0.3); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .cl-result { background: rgba(255,255,255,0.03); border: 1px solid rgba(0,212,180,0.15); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .cl-text { font-size: 0.78rem; color: rgba(255,255,255,0.75); line-height: 1.7; white-space: pre-wrap; font-family: inherit; margin: 0; max-height: 320px; overflow-y: auto; }
    .cl-actions { display: flex; gap: 7px; }
    .ai-accept { flex: 1; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.75rem; font-weight: 600; padding: 7px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-regen { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.75rem; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-discard { background: transparent; border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.7); font-size: 0.75rem; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .copied-note { font-size: 0.72rem; color: #00d4b4; text-align: center; margin: 0; }
  `]
})
export class CoverLetterGeneratorComponent {
  @Input({ required: true }) resumeId!: number;
  @Input() targetJobTitle = '';

  private aiApi = inject(AiApiService);
  private auth  = inject(AuthService);

  jobDescription = '';
  result  = '';
  loading = false;
  error   = '';
  copied  = false;

  get isPremium(): boolean {
    return this.auth.getCurrentPlan() === 'PREMIUM';
  }

  generate(): void {
    if (!this.jobDescription.trim()) return;
    this.loading = true;
    this.error   = '';
    this.result  = '';

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.generateCoverLetter({
      userId,
      resumeId: this.resumeId,
      targetJobTitle: this.targetJobTitle,
      existingContent: this.jobDescription
    }).subscribe({
      next: res => { this.result = res.content ?? ''; this.loading = false; },
      error: err => { this.error = err?.error?.message ?? 'Failed to generate cover letter.'; this.loading = false; }
    });
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.result).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}

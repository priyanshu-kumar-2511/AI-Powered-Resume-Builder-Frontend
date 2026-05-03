import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PremiumLockComponent } from '../shared/premium-lock.component';

const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'it', label: 'Italian' },
];

@Component({
  selector: 'app-translate-resume',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumLockComponent],
  template: `
    @if (!isPremium) {
      <app-premium-lock message="Translate your entire resume into any language while preserving structure." />
    } @else {
      <div class="translate">
        <div class="ai-gen-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
          Translate Resume
        </div>

        <div class="lang-select-wrap">
          <select class="ai-select" [(ngModel)]="targetLanguage">
            <option value="">Select target language…</option>
            @for (lang of languages; track lang.code) {
              <option [value]="lang.label">{{ lang.label }}</option>
            }
          </select>
        </div>

        <div class="translate-note">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          This will create a new translated copy of your resume.
        </div>

        <button class="ai-btn" (click)="showConfirm = true" [disabled]="!targetLanguage">
          🌐 Translate Resume
        </button>

        <!-- Confirmation dialog -->
        @if (showConfirm) {
          <div class="confirm-dialog">
            <p class="confirm-text">Translate to <strong>{{ targetLanguage }}</strong>? A new resume copy will be created.</p>
            <div class="confirm-actions">
              <button class="ai-accept" (click)="translate()">Yes, Translate</button>
              <button class="ai-discard" (click)="showConfirm = false">Cancel</button>
            </div>
          </div>
        }

        @if (loading) {
          <div class="translate-loading">
            <span class="ai-spinner"></span>
            Translating to {{ targetLanguage }}…
          </div>
        }

        @if (error) { <p class="ai-error">{{ error }}</p> }

        @if (success) {
          <div class="translate-success">
            <svg width="18" height="18" fill="none" stroke="#00d4b4" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Resume translated! The new copy has been created.
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .translate { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .lang-select-wrap { display: flex; gap: 8px; }
    .ai-select { flex: 1; background: #171c26; border: 1px solid rgba(0,212,180,0.35); border-radius: 7px; color: #f8fafc; font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; transition: border-color 0.2s; color-scheme: dark; }
    .ai-select:focus { border-color: rgba(0,212,180,0.4); }
    .ai-select option { background: #0f172a; color: #fff; }
    .ai-select option:checked { background: #0f766e; color: #fff; }
    .translate-note { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.35); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .confirm-dialog { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .confirm-text { font-size: 0.8rem; color: rgba(255,255,255,0.75); margin: 0; }
    .confirm-text strong { color: #00d4b4; }
    .confirm-actions { display: flex; gap: 8px; }
    .ai-accept { flex: 1; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.75rem; font-weight: 600; padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-discard { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 0.75rem; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .translate-loading { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: rgba(255,255,255,0.5); }
    .translate-success { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #00d4b4; background: rgba(0,212,180,0.08); border: 1px solid rgba(0,212,180,0.2); padding: 10px 14px; border-radius: 8px; font-weight: 600; }
  `]
})
export class TranslateResumeComponent {
  @Input({ required: true }) resumeId!: number;
  @Input() resumeContent = '';
  @Output() translationCreated = new EventEmitter<string>();

  private aiApi = inject(AiApiService);
  private auth  = inject(AuthService);

  readonly languages = LANGUAGES;
  targetLanguage = '';
  showConfirm = false;
  loading     = false;
  error       = '';
  success     = false;

  get isPremium(): boolean { return this.auth.getCurrentPlan() === 'PREMIUM'; }

  translate(): void {
    this.showConfirm = false;
    this.loading     = true;
    this.error       = '';
    this.success     = false;

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.translateResume({
      userId,
      resumeId: this.resumeId,
      targetLanguage: this.targetLanguage,
      existingContent: this.resumeContent
    }).subscribe({
      next: res => {
        this.loading  = false;
        this.success  = true;
        this.translationCreated.emit(res.content ?? '');
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Translation failed. Please try again.';
        this.loading = false;
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuotaStateService } from '../services/quota-state.service';
import { AtsReport } from '../models/ai.models';

@Component({
  selector: 'app-ats-checker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ats-checker">
      <div class="ai-gen-header">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        ATS Check
        @if (!quota.isPremium) {
          <span class="ats-quota-badge">{{ quota.remainingAts }}/3 left</span>
        }
      </div>

      <textarea class="ai-textarea" placeholder="Paste job description (optional)…" [(ngModel)]="jobDescription" rows="4"></textarea>

      <button class="ai-btn" (click)="runCheck()" [disabled]="loading">
        @if (loading) { <span class="ai-spinner"></span> Analysing… }
        @else { ⚡ Run ATS Check }
      </button>

      @if (error) { <p class="ai-error">{{ error }}</p> }

      @if (report) {
        <div class="ats-result">
          <!-- Score ring -->
          <div class="ats-score-row">
            <div class="ats-ring-wrap">
              <svg class="ats-ring-svg" viewBox="0 0 36 36">
                <circle class="ats-track" cx="18" cy="18" r="15.9" fill="none" stroke-width="3"/>
                <circle class="ats-fill" cx="18" cy="18" r="15.9" fill="none" stroke-width="3"
                  [style.stroke]="scoreColor"
                  [style.stroke-dasharray]="scoreDash"
                  stroke-dashoffset="25"
                  stroke-linecap="round"
                  transform="rotate(-90 18 18)"/>
              </svg>
              <span class="ats-score-val" [style.color]="scoreColor">{{ report.score }}</span>
            </div>
            <div class="ats-score-info">
              <span class="ats-score-label">ATS Score</span>
              <span class="ats-score-desc">{{ scoreLabel }}</span>
            </div>
          </div>

          <!-- Suggestions -->
          @if (report.suggestions.length) {
            <div class="ats-suggestions">
              <p class="ats-sugg-title">Improvement suggestions</p>
              @for (s of report.suggestions; track s) {
                <div class="ats-sugg-item">
                  <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  {{ s }}
                </div>
              }
            </div>
          }

          <!-- Missing keywords -->
          @if (report.missingKeywords?.length) {
            <div class="ats-keywords">
              <p class="ats-sugg-title">Missing keywords</p>
              <div class="kw-chips">
                @for (kw of report.missingKeywords; track kw) {
                  <span class="kw-chip">{{ kw }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ats-checker { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .ats-quota-badge { margin-left: auto; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 0.68rem; color: rgba(255,255,255,0.5); font-weight: 500; }
    .ai-textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; resize: vertical; transition: border-color 0.2s; }
    .ai-textarea:focus { border-color: rgba(0,212,180,0.4); }
    .ai-textarea::placeholder { color: rgba(255,255,255,0.3); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .ats-result { background: rgba(255,255,255,0.03); border: 1px solid rgba(0,212,180,0.15); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 14px; }
    .ats-score-row { display: flex; align-items: center; gap: 14px; }
    .ats-ring-wrap { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
    .ats-ring-svg { width: 64px; height: 64px; }
    .ats-track { stroke: rgba(255,255,255,0.08); }
    .ats-fill { transition: stroke-dasharray 0.6s ease; }
    .ats-score-val { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 800; }
    .ats-score-info { display: flex; flex-direction: column; gap: 3px; }
    .ats-score-label { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.06em; }
    .ats-score-desc { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .ats-suggestions, .ats-keywords { display: flex; flex-direction: column; gap: 6px; }
    .ats-sugg-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); margin: 0; }
    .ats-sugg-item { display: flex; align-items: flex-start; gap: 6px; font-size: 0.77rem; color: rgba(255,255,255,0.65); line-height: 1.4; }
    .kw-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .kw-chip { font-size: 0.7rem; padding: 3px 9px; border-radius: 12px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.8); }
  `]
})
export class AtsCheckerComponent {
  @Input({ required: true }) resumeId!: number;
  @Input() resumeContent = '';
  @Output() scoreUpdated = new EventEmitter<number>();

  private aiApi      = inject(AiApiService);
  private auth       = inject(AuthService);
  private quotaState = inject(QuotaStateService);

  jobDescription = '';
  report: AtsReport | null = null;
  loading = false;
  error   = '';

  get quota() { return this.quotaState.getSnapshot(); }

  get scoreColor(): string {
    const s = this.report?.score ?? 0;
    if (s >= 80) return '#00d4b4';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  }

  get scoreDash(): string {
    const pct = (this.report?.score ?? 0) / 100;
    const circ = 2 * Math.PI * 15.9;
    return `${pct * circ} ${circ}`;
  }

  get scoreLabel(): string {
    const s = this.report?.score ?? 0;
    if (s >= 80) return 'Excellent — ATS friendly';
    if (s >= 50) return 'Fair — some improvements needed';
    return 'Poor — needs significant work';
  }

  runCheck(): void {
    this.loading = true;
    this.error   = '';
    const userId = String(this.auth.getCurrentUserId() ?? '');

    this.aiApi.checkAts({
      userId,
      resumeId: this.resumeId,
      existingContent: this.resumeContent,
      jobDescription: this.jobDescription
    }).subscribe({
      next: report => {
        this.report  = report;
        this.loading = false;
        this.scoreUpdated.emit(report.score);
      },
      error: err => {
        this.error   = err?.error?.message ?? 'ATS check failed. Please try again.';
        this.loading = false;
      }
    });
  }
}

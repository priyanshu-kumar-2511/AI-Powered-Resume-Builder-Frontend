import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PremiumLockComponent } from '../shared/premium-lock.component';
import { AiHistoryRecord } from '../models/ai.models';

const TYPE_ICONS: Record<string, string> = {
  GENERATE_SUMMARY: '📝',
  GENERATE_BULLETS: '•',
  CHECK_ATS:        '⚡',
  SUGGEST_SKILLS:   '✦',
  GENERATE_COVER_LETTER: '📄',
  IMPROVE_SECTION:  '✏️',
  TAILOR_RESUME:    '🎯',
  TRANSLATE_RESUME: '🌐',
};

@Component({
  selector: 'app-ai-history',
  standalone: true,
  imports: [CommonModule, PremiumLockComponent],
  template: `
    @if (!isPremium) {
      <app-premium-lock message="View your full AI interaction history with prompts and responses." />
    } @else {
      <div class="ai-history">
        <div class="ai-gen-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.9L1 10"/></svg>
          AI History
        </div>

        @if (loading) {
          <div class="hist-loading">
            @for (s of [1,2,3]; track s) {
              <div class="hist-shimmer"></div>
            }
          </div>
        }

        @if (!loading && !records.length) {
          <p class="hist-empty">No AI history yet. Start using AI features above.</p>
        }

        @for (rec of pagedRecords; track rec.id) {
          <div class="hist-row" [class.expanded]="expandedId === rec.id" (click)="toggle(rec.id)">
            <div class="hist-row-top">
              <span class="hist-icon">{{ typeIcon(rec.requestType) }}</span>
              <div class="hist-info">
                <span class="hist-type">{{ rec.requestType.replace('_', ' ') }}</span>
                <span class="hist-prompt">{{ rec.inputPrompt | slice:0:80 }}…</span>
              </div>
              <div class="hist-meta">
                <span class="hist-model">{{ rec.model }}</span>
                <span class="hist-tokens">{{ rec.tokensUsed }} tok</span>
                <span class="hist-date">{{ rec.timestamp | date:'MMM d, HH:mm' }}</span>
              </div>
              <svg class="hist-chevron" [class.open]="expandedId === rec.id" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            @if (expandedId === rec.id) {
              <div class="hist-response">
                <p class="hist-response-label">Response</p>
                <pre class="hist-response-text">{{ rec.response }}</pre>
              </div>
            }
          </div>
        }

        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="hist-pagination">
            <button class="page-btn" [disabled]="currentPage === 0" (click)="currentPage = currentPage - 1">← Prev</button>
            <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
            <button class="page-btn" [disabled]="currentPage >= totalPages - 1" (click)="currentPage = currentPage + 1">Next →</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .ai-history { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .hist-loading { display: flex; flex-direction: column; gap: 6px; }
    .hist-shimmer { height: 52px; border-radius: 8px; background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .hist-empty { font-size: 0.78rem; color: rgba(255,255,255,0.3); }
    .hist-row { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
    .hist-row:hover, .hist-row.expanded { border-color: rgba(0,212,180,0.2); }
    .hist-row-top { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
    .hist-icon { font-size: 0.9rem; width: 20px; text-align: center; flex-shrink: 0; }
    .hist-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .hist-type { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.6); }
    .hist-prompt { font-size: 0.75rem; color: rgba(255,255,255,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hist-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
    .hist-model { font-size: 0.65rem; background: rgba(0,212,180,0.1); border: 1px solid rgba(0,212,180,0.2); color: #00d4b4; padding: 1px 6px; border-radius: 8px; }
    .hist-tokens, .hist-date { font-size: 0.65rem; color: rgba(255,255,255,0.3); }
    .hist-chevron { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.2s; }
    .hist-chevron.open { transform: rotate(180deg); }
    .hist-response { padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .hist-response-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.3); margin: 0 0 6px; }
    .hist-response-text { font-size: 0.76rem; color: rgba(255,255,255,0.65); white-space: pre-wrap; font-family: inherit; margin: 0; max-height: 180px; overflow-y: auto; line-height: 1.55; }
    .hist-pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 4px; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
    .page-btn:disabled { opacity: 0.3; cursor: default; }
    .page-info { font-size: 0.73rem; color: rgba(255,255,255,0.35); }
  `]
})
export class AiHistoryComponent implements OnInit {
  private aiApi = inject(AiApiService);
  private auth  = inject(AuthService);

  records: AiHistoryRecord[] = [];
  loading     = false;
  expandedId: number | null = null;
  currentPage = 0;
  readonly pageSize = 10;

  get isPremium(): boolean { return this.auth.getCurrentPlan() === 'PREMIUM'; }
  get totalPages(): number { return Math.ceil(this.records.length / this.pageSize); }
  get pagedRecords(): AiHistoryRecord[] {
    const start = this.currentPage * this.pageSize;
    return this.records.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    if (!this.isPremium) return;
    this.loading = true;
    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.getHistory(userId).subscribe({
      next: recs => { this.records = recs; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  typeIcon(type: string): string {
    return TYPE_ICONS[type] ?? '🤖';
  }
}

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExportApiService } from '../services/export-api.service';
import { ExportStats } from '../../../shared/models/models';

const FREE_PDF_LIMIT = 10;

@Component({
  selector: 'app-rate-limit-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (stats && !isPremium) {
      <div class="rl-banner" [class.rl-danger]="isAtLimit" [class.rl-warn]="isNearLimit && !isAtLimit">
        <div class="rl-left">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            @if (isAtLimit) {
              Daily PDF limit reached ({{ FREE_PDF_LIMIT }}/{{ FREE_PDF_LIMIT }})
            } @else {
              {{ stats.todayPdfCount }} of {{ FREE_PDF_LIMIT }} free PDF exports used today
            }
          </span>
        </div>
        <a routerLink="/pricing" class="rl-upgrade-btn">
          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Upgrade
        </a>
      </div>

      <!-- Progress bar -->
      <div class="rl-bar-wrap">
        <div class="rl-bar-fill"
             [style.width.%]="barPercent"
             [class.rl-bar-danger]="isAtLimit"
             [class.rl-bar-warn]="isNearLimit && !isAtLimit">
        </div>
      </div>
    }

    @if (loading) {
      <div class="rl-skeleton"></div>
    }
  `,
  styles: [`
    .rl-banner {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; padding: 8px 12px; border-radius: 8px;
      background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.2);
      font-size: 0.75rem; color: rgba(255,255,255,0.7);
      margin-bottom: 4px;
    }
    .rl-banner.rl-danger {
      background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); color: #fca5a5;
    }
    .rl-banner.rl-warn { color: #fde68a; }
    .rl-left { display: flex; align-items: center; gap: 7px; }
    .rl-upgrade-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 5px;
      background: linear-gradient(135deg,#00d4b4,#00b89c);
      color: #000; font-weight: 700; font-size: 0.7rem;
      text-decoration: none; white-space: nowrap; flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .rl-upgrade-btn:hover { opacity: 0.85; }
    .rl-bar-wrap {
      height: 3px; background: rgba(255,255,255,0.06);
      border-radius: 2px; overflow: hidden; margin-bottom: 12px;
    }
    .rl-bar-fill {
      height: 100%; border-radius: 2px;
      background: #eab308; transition: width 0.4s ease;
    }
    .rl-bar-fill.rl-bar-danger { background: #ef4444; }
    .rl-bar-fill.rl-bar-warn   { background: #f59e0b; }
    .rl-skeleton {
      height: 34px; border-radius: 8px;
      background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: 8px;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `]
})
export class RateLimitBannerComponent implements OnInit {
  @Input({ required: true }) userId!: number;
  private auth      = inject(AuthService);
  private exportApi = inject(ExportApiService);

  stats:   ExportStats | null = null;
  loading  = true;

  get isPremium(): boolean {
    return this.auth.getCurrentPlan() === 'PREMIUM' || this.auth.isAdmin();
  }
  readonly FREE_PDF_LIMIT = FREE_PDF_LIMIT;

  get barPercent(): number {
    if (!this.stats) return 0;
    return Math.min(100, (this.stats.todayPdfCount / FREE_PDF_LIMIT) * 100);
  }
  get isAtLimit():   boolean { return (this.stats?.todayPdfCount ?? 0) >= FREE_PDF_LIMIT; }
  get isNearLimit(): boolean { return (this.stats?.todayPdfCount ?? 0) >= FREE_PDF_LIMIT * 0.7; }

  ngOnInit(): void {
    this.exportApi.getStats(this.userId).subscribe({
      next:  s  => { this.stats = s;  this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}

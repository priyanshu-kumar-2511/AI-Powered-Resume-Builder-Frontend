import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AiApiService } from '../services/ai-api.service';
import { QuotaStateService } from '../services/quota-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuotaInfo } from '../models/ai.models';

@Component({
  selector: 'app-quota-badge',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (quota) {
      <div class="quota-badge" [class.warn]="isCritical" [class.premium]="quota.isPremium">
        @if (quota.isPremium) {
          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Premium
        } @else {
          <span class="quota-count">{{ quota.remainingSummary }}/{{ quota.summaryLimit }}</span>
          <span class="quota-label">AI calls left</span>
          @if (isCritical) {
            <a routerLink="/profile" class="upgrade-link">Upgrade</a>
          }
        }
      </div>
    }
  `,
  styles: [`
    .quota-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; padding: 4px 10px;
      font-size: 0.7rem; color: rgba(255,255,255,0.5);
    }
    .quota-badge.warn { border-color: rgba(239,68,68,0.4); color: #ef4444; background: rgba(239,68,68,0.08); }
    .quota-badge.premium { border-color: rgba(250,204,21,0.4); color: #facc15; background: rgba(250,204,21,0.08); }
    .quota-count { font-weight: 700; }
    .upgrade-link { color: #00d4b4; text-decoration: none; font-weight: 600; margin-left: 4px; }
    .upgrade-link:hover { text-decoration: underline; }
  `]
})
export class QuotaBadgeComponent implements OnInit {
  private aiApi      = inject(AiApiService);
  private quotaState = inject(QuotaStateService);
  private auth       = inject(AuthService);

  quota: QuotaInfo | null = null;

  get isCritical(): boolean {
    return !this.quota?.isPremium && (this.quota?.remainingSummary ?? 5) <= 1;
  }

  ngOnInit(): void {
    const userId = String(this.auth.getCurrentUserId() ?? '');
    if (userId) {
      this.aiApi.getQuota(userId).subscribe();
    }
    this.quotaState.quota.subscribe(q => this.quota = q);
  }
}

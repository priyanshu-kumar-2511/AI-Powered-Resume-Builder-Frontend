import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../services/admin-api.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1 class="page-title">Broadcast Notifications</h1>
        <p class="page-sub">Send in-app and email alerts to users</p>
      </div>

      <div class="broadcast-card">
        <div class="bc-icon">📢</div>
        <h2 class="bc-title">Send Platform Notification</h2>
        <p class="bc-desc">Broadcast a message to all users, Free users, or Premium users.</p>

        <!-- Target selector -->
        <div class="target-group">
          @for (t of targets; track t.key) {
            <button class="target-btn" [class.active]="target === t.key" (click)="target = t.key">
              <span class="tb-icon">{{ t.icon }}</span>
              <span class="tb-label">{{ t.label }}</span>
              <span class="tb-desc">{{ t.desc }}</span>
            </button>
          }
        </div>

        <div class="form-section">
          <div class="form-row">
            <label class="form-label">Notification Title *</label>
            <input class="form-input" [(ngModel)]="title"
                   placeholder="e.g. New Feature: AI Cover Letter Generator">
          </div>
          <div class="form-row">
            <label class="form-label">Message *</label>
            <textarea class="form-textarea" [(ngModel)]="message" rows="4"
                      placeholder="Write your notification message here…"></textarea>
            <div class="char-count">{{ message.length }} / 500 characters</div>
          </div>

          @if (errorMsg) {
            <div class="form-error">{{ errorMsg }}</div>
          }

          <button class="send-btn" (click)="send()" [disabled]="sending || !title.trim() || !message.trim()">
            @if (sending) {
              <div class="btn-spinner"></div> Sending…
            } @else {
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send to {{ targetLabel }}
            }
          </button>
        </div>
      </div>

      <!-- Sent history (local session) -->
      @if (sentHistory.length > 0) {
        <div class="history-card">
          <div class="history-title">📋 Sent This Session</div>
          <div class="history-list">
            @for (h of sentHistory; track h.sentAt) {
              <div class="history-row">
                <div class="history-left">
                  <span class="history-target-badge" [class.badge-all]="h.target==='ALL'" [class.badge-free]="h.target==='FREE'" [class.badge-premium]="h.target==='PREMIUM'">
                    {{ h.target }}
                  </span>
                  <div>
                    <div class="history-msg-title">{{ h.title }}</div>
                    <div class="history-msg-body">{{ h.message }}</div>
                  </div>
                </div>
                <div class="history-time">{{ h.sentAt | date:'HH:mm' }}</div>
              </div>
            }
          </div>
        </div>
      }

      @if (successMsg) {
        <div class="toast">{{ successMsg }}</div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px 36px; max-width: 800px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: rgba(255,255,255,0.9); margin: 0 0 4px; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin: 0; }

    .broadcast-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 28px; margin-bottom: 18px; }
    .bc-icon { font-size: 2.2rem; margin-bottom: 10px; }
    .bc-title { font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0 0 6px; }
    .bc-desc { font-size: 0.78rem; color: rgba(255,255,255,0.35); margin: 0 0 22px; }

    .target-group { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
    .target-btn { flex: 1; min-width: 140px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .target-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
    .target-btn.active { background: rgba(0,212,180,0.08); border-color: rgba(0,212,180,0.35); color: #00d4b4; }
    .tb-icon { font-size: 1.4rem; }
    .tb-label { font-size: 0.8rem; font-weight: 700; }
    .tb-desc { font-size: 0.65rem; color: inherit; opacity: 0.7; }

    .form-section { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; flex-direction: column; gap: 5px; }
    .form-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); font-weight: 500; }
    .form-input, .form-textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 0.82rem; padding: 10px 12px; font-family: inherit; outline: none; resize: vertical; }
    .form-input:focus, .form-textarea:focus { border-color: rgba(0,212,180,0.4); }
    .char-count { font-size: 0.66rem; color: rgba(255,255,255,0.25); text-align: right; }
    .form-error { font-size: 0.75rem; color: #f87171; }

    .send-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 10px; background: linear-gradient(135deg,#00d4b4,#00b89c); color: #000; font-weight: 700; font-size: 0.88rem; border: none; cursor: pointer; font-family: inherit; transition: opacity 0.2s, transform 0.2s; align-self: flex-start; }
    .send-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .btn-spinner { width: 13px; height: 13px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.3); border-top-color: #000; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .history-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px 22px; }
    .history-title { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 14px; }
    .history-list { display: flex; flex-direction: column; gap: 10px; }
    .history-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .history-row:last-child { border-bottom: none; padding-bottom: 0; }
    .history-left { display: flex; align-items: flex-start; gap: 10px; }
    .history-target-badge { font-size: 0.6rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; flex-shrink: 0; margin-top: 2px; }
    .badge-all     { background: rgba(59,130,246,0.15); color: #93c5fd; }
    .badge-free    { background: rgba(0,212,180,0.12); color: #00d4b4; }
    .badge-premium { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .history-msg-title { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.75); }
    .history-msg-body { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 2px; }
    .history-time { font-size: 0.68rem; color: rgba(255,255,255,0.25); white-space: nowrap; flex-shrink: 0; }

    .toast { position: fixed; bottom: 24px; right: 24px; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; padding: 10px 18px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; z-index: 2000; }
  `]
})
export class AdminNotificationsComponent {
  private adminApi = inject(AdminApiService);

  target   = 'ALL';
  title    = '';
  message  = '';
  sending  = false;
  errorMsg = '';
  successMsg = '';
  sentHistory: { target: string; title: string; message: string; sentAt: Date }[] = [];

  readonly targets = [
    { key: 'ALL',     icon: '🌍', label: 'All Users',     desc: 'Everyone on the platform' },
    { key: 'FREE',    icon: '🆓', label: 'Free Users',    desc: 'Free plan users only'     },
    { key: 'PREMIUM', icon: '⭐', label: 'Premium Users', desc: 'Premium plan users only'  }
  ];

  get targetLabel(): string { return this.targets.find(t => t.key === this.target)?.label ?? 'All Users'; }

  send(): void {
    if (!this.title.trim() || !this.message.trim()) { this.errorMsg = 'Title and message are required.'; return; }
    this.sending = true; this.errorMsg = '';

    const req$ = this.target === 'ALL'
      ? this.adminApi.sendBroadcastToAll(this.title, this.message)
      : this.adminApi.sendBroadcastByPlan(this.target as 'FREE' | 'PREMIUM', this.title, this.message);

    req$.subscribe({
      next: () => {
        this.sentHistory.unshift({ target: this.target, title: this.title, message: this.message, sentAt: new Date() });
        this.sending = false;
        this.successMsg = `Notification sent to ${this.targetLabel}!`;
        this.title = ''; this.message = '';
        setTimeout(() => this.successMsg = '', 3500);
      },
      error: () => { this.sending = false; this.errorMsg = 'Failed to send. Please try again.'; }
    });
  }
}

import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationApiService }     from '../services/notification-api.service';
import { NotificationPollingService } from '../services/notification-polling.service';
import { NotificationItemComponent }  from '../item/notification-item.component';
import { AuthService }                from '../../../core/services/auth.service';
import { Notification }               from '../../../shared/models/models';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationItemComponent],
  template: `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Notifications</span>
        @if (notifications.length > 0) {
          <button class="mark-all-btn" (click)="markAllRead()">Mark all read</button>
        }
      </div>

      @if (loading) {
        <div class="panel-empty">
          <div class="spinner"></div>
        </div>
      } @else if (notifications.length === 0) {
        <div class="panel-empty">
          <span class="empty-icon">🔔</span>
          <span>No notifications yet</span>
        </div>
      } @else {
        <div class="panel-list">
          @for (n of notifications; track n.id) {
            <app-notification-item
              [notification]="n"
              (markRead)="onMarkRead($event)"
            />
          }
        </div>
      }

      <div class="panel-footer">
        <a routerLink="/notifications" (click)="close.emit()">View all notifications →</a>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      width: 360px; background: var(--bg-card);
      border: 1px solid var(--border); border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--border);
    }
    .panel-title { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); }
    .mark-all-btn {
      background: none; border: none; cursor: pointer;
      font-size: 0.75rem; color: var(--teal); font-weight: 600;
    }
    .mark-all-btn:hover { text-decoration: underline; }
    .panel-list { max-height: 360px; overflow-y: auto; padding: 8px; }
    .panel-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px;
      padding: 40px 16px; color: var(--text-muted, #6b7280);
      font-size: 0.85rem;
    }
    .empty-icon { font-size: 2rem; opacity: 0.4; }
    .spinner {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: var(--teal);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .panel-footer {
      padding: 12px 16px; border-top: 1px solid var(--border);
      text-align: center;
    }
    .panel-footer a {
      font-size: 0.8rem; color: var(--teal); text-decoration: none; font-weight: 600;
    }
    .panel-footer a:hover { text-decoration: underline; }
  `]
})
export class NotificationPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private api      = inject(NotificationApiService);
  private polling  = inject(NotificationPollingService);
  private auth     = inject(AuthService);

  notifications: Notification[] = [];
  loading = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const uid = this.auth.getCurrentUserId();
    if (!uid) { this.loading = false; return; }
    this.api.getByRecipient(uid, 0, 5).subscribe({
      next:  page  => { this.notifications = page.content; this.loading = false; },
      error: ()    => { this.loading = false; }
    });
  }

  onMarkRead(id: number): void {
    this.api.markRead(id).subscribe(() => {
      const n = this.notifications.find(n => n.id === id);
      if (n) n.isRead = true;
      this.polling.refresh();
    });
  }

  markAllRead(): void {
    const uid = this.auth.getCurrentUserId();
    if (!uid) return;
    this.api.markAllRead(uid).subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.polling.refresh();
    });
  }
}

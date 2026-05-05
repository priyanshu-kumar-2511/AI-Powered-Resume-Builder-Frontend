import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationType } from '../../../shared/models/models';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-item"
         [class.unread]="!notification.isRead"
         [style.--type-color]="typeColor"
         (click)="onItemClick()">
      <div class="type-bar"></div>
      <div class="item-icon">{{ typeIcon }}</div>
      <div class="item-body">
        <div class="item-title">{{ notification.title }}</div>
        <div class="item-message">{{ notification.message }}</div>
        <div class="item-time">{{ relativeTime }}</div>
      </div>
      @if (showDelete) {
        <button class="delete-btn" (click)="onDelete($event)" title="Delete">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    .notification-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 14px; border-radius: 8px;
      cursor: pointer; position: relative;
      transition: background 0.15s;
      border: 1px solid transparent;
    }
    .notification-item:hover { background: var(--bg-surface); }
    .notification-item.unread {
      background: rgba(var(--type-color-rgb, 0,212,180), 0.04);
      border-color: rgba(var(--type-color-rgb, 0,212,180), 0.15);
    }
    .type-bar {
      position: absolute; left: 0; top: 8px; bottom: 8px;
      width: 3px; border-radius: 0 2px 2px 0;
      background: var(--type-color, var(--teal));
      opacity: 0;
    }
    .unread .type-bar { opacity: 1; }
    .item-icon {
      font-size: 1.2rem; flex-shrink: 0;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-surface); border-radius: 8px;
    }
    .item-body { flex: 1; min-width: 0; }
    .item-title {
      font-size: 0.85rem; font-weight: 600;
      color: var(--text-primary); margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .item-message {
      font-size: 0.78rem; color: var(--text-secondary);
      overflow: hidden; text-overflow: ellipsis;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .item-time {
      font-size: 0.72rem; color: var(--text-muted, #6b7280);
      margin-top: 4px;
    }
    .delete-btn {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted, #6b7280); padding: 4px;
      border-radius: 4px; opacity: 0;
      transition: opacity 0.15s, color 0.15s;
    }
    .notification-item:hover .delete-btn { opacity: 1; }
    .delete-btn:hover { color: #f87171; }
  `]
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: Notification;
  @Input() showDelete = false;
  @Output() markRead  = new EventEmitter<number>();
  @Output() deleted   = new EventEmitter<number>();

  get typeIcon(): string {
    const icons: Record<NotificationType, string> = {
      SUCCESS: '✅', INFO: 'ℹ️', ALERT: '⚠️',
      WARNING: '🔔', SYSTEM: '⚙️', PROMO: '🎁'
    };
    return icons[this.notification.type] ?? '🔔';
  }

  get typeColor(): string {
    const colors: Record<NotificationType, string> = {
      SUCCESS: '#22c55e', INFO: '#3b82f6', ALERT: '#ef4444',
      WARNING: '#f59e0b', SYSTEM: '#8b5cf6', PROMO: '#00d4b4'
    };
    return colors[this.notification.type] ?? 'var(--teal)';
  }

  get relativeTime(): string {
    const now  = new Date();
    const then = new Date(this.notification.createdAt);
    const diffMs  = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  }

  onItemClick(): void {
    if (!this.notification.isRead) {
      this.markRead.emit(this.notification.id);
    }
  }

  onDelete(e: Event): void {
    e.stopPropagation();
    this.deleted.emit(this.notification.id);
  }
}

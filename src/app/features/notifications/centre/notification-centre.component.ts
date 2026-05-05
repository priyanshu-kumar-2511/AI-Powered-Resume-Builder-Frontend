import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { NavbarComponent }            from '../../../shared/components/navbar/navbar.component';
import { NotificationItemComponent }  from '../item/notification-item.component';
import { NotificationApiService }     from '../services/notification-api.service';
import { NotificationPollingService } from '../services/notification-polling.service';
import { AuthService }                from '../../../core/services/auth.service';
import { Notification, NotificationType } from '../../../shared/models/models';

type FilterType = 'ALL' | NotificationType;

@Component({
  selector: 'app-notification-centre',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, NotificationItemComponent],
  template: `
    <app-navbar />
    <div class="page">
      <div class="page-inner">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">🔔 Notifications</h1>
            <p class="page-sub">Stay updated on your resume activity</p>
          </div>
          @if (hasUnread) {
            <button class="btn-mark-all" (click)="markAllRead()">✓ Mark all read</button>
          }
        </div>

        <!-- Filters -->
        <div class="filters">
          <div class="filter-tabs">
            <button class="filter-tab" [class.active]="showUnread === false" (click)="setUnread(false)">All</button>
            <button class="filter-tab" [class.active]="showUnread === true"  (click)="setUnread(true)">Unread
              @if (totalUnread > 0) {
                <span class="tab-badge">{{ totalUnread }}</span>
              }
            </button>
          </div>
          <select class="type-select" [(ngModel)]="typeFilter" (change)="applyFilters()">
            <option value="ALL">All types</option>
            <option value="SUCCESS">✅ Success</option>
            <option value="INFO">ℹ️ Info</option>
            <option value="ALERT">⚠️ Alert</option>
            <option value="WARNING">🔔 Warning</option>
            <option value="SYSTEM">⚙️ System</option>
            <option value="PROMO">🎁 Promo</option>
          </select>
        </div>

        <!-- List -->
        @if (loading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Loading notifications…</span>
          </div>
        } @else if (filtered.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <h3>No notifications</h3>
            @if (showUnread) {
              <p>No unread notifications.</p>
            } @else {
              <p>You're all caught up!</p>
            }
          </div>
        } @else {
          <div class="notif-list">
            @for (n of filtered; track n.id) {
              <app-notification-item
                [notification]="n"
                [showDelete]="true"
                (markRead)="onMarkRead($event)"
                (deleted)="onDelete($event)"
              />
            }
          </div>

          <!-- Pagination -->
          @if (totalPages > 1) {
            <div class="pagination">
              <button [disabled]="currentPage === 0" (click)="goPage(currentPage - 1)">← Prev</button>
              <span>Page {{ currentPage + 1 }} / {{ totalPages }}</span>
              <button [disabled]="currentPage >= totalPages - 1" (click)="goPage(currentPage + 1)">Next →</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: calc(100vh - 64px); padding: 40px 24px; background: var(--bg-base, #080b12); }
    .page-inner { max-width: 720px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-sub { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }

    .btn-mark-all {
      background: var(--bg-surface); border: 1px solid var(--border);
      color: var(--teal); border-radius: 8px; padding: 8px 16px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    .btn-mark-all:hover { background: rgba(0,212,180,0.08); }

    .filters {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .filter-tabs { display: flex; gap: 4px; background: var(--bg-surface); padding: 4px; border-radius: 8px; }
    .filter-tab {
      background: none; border: none; cursor: pointer;
      padding: 6px 14px; border-radius: 6px; font-size: 0.82rem;
      color: var(--text-secondary); font-weight: 500; display: flex; align-items: center; gap: 6px;
      transition: all 0.15s;
    }
    .filter-tab.active { background: var(--bg-card); color: var(--text-primary); font-weight: 700; }
    .tab-badge {
      background: #ef4444; color: #fff; border-radius: 8px;
      padding: 1px 6px; font-size: 0.68rem; font-weight: 700;
    }
    .type-select {
      background: var(--bg-surface); border: 1px solid var(--border);
      color: var(--text-primary); padding: 7px 12px; border-radius: 8px;
      font-size: 0.82rem; cursor: pointer; outline: none;
    }

    .notif-list { display: flex; flex-direction: column; gap: 6px; }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 80px 0;
      color: var(--text-secondary); font-size: 0.875rem;
    }
    .empty-icon { font-size: 3rem; opacity: 0.3; }
    .empty-state h3 { font-size: 1.1rem; color: var(--text-primary); margin: 0; }
    .empty-state p { margin: 0; }
    .spinner {
      width: 32px; height: 32px; border-radius: 50%;
      border: 3px solid var(--border); border-top-color: var(--teal);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; margin-top: 28px;
    }
    .pagination button {
      background: var(--bg-surface); border: 1px solid var(--border);
      color: var(--text-primary); padding: 8px 16px; border-radius: 8px;
      font-size: 0.82rem; cursor: pointer; transition: background 0.15s;
    }
    .pagination button:hover:not(:disabled) { background: var(--bg-card); }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: 0.82rem; color: var(--text-secondary); }
  `]
})
export class NotificationCentreComponent implements OnInit {
  private api     = inject(NotificationApiService);
  private polling = inject(NotificationPollingService);
  private auth    = inject(AuthService);

  notifications: Notification[] = [];
  filtered:      Notification[] = [];
  loading      = true;
  currentPage  = 0;
  totalPages   = 1;
  totalUnread  = 0;
  showUnread   = false;
  typeFilter: FilterType = 'ALL';

  get hasUnread(): boolean { return this.notifications.some(n => !n.isRead); }

  ngOnInit(): void {
    this.loadPage(0);
    this.polling.unreadCount$.subscribe(c => this.totalUnread = c);
  }

  loadPage(page: number): void {
    const uid = this.auth.getCurrentUserId();
    if (!uid) { this.loading = false; return; }
    this.loading = true;
    this.api.getByRecipient(uid, page, 20).subscribe({
      next: p => {
        this.notifications = p.content;
        this.currentPage   = p.number;
        this.totalPages    = p.totalPages;
        this.loading       = false;
        this.applyFilters();
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    this.filtered = this.notifications.filter(n => {
      const unreadOk = !this.showUnread || !n.isRead;
      const typeOk   = this.typeFilter === 'ALL' || n.type === this.typeFilter;
      return unreadOk && typeOk;
    });
  }

  setUnread(val: boolean): void {
    this.showUnread = val;
    this.applyFilters();
  }

  goPage(p: number): void {
    this.loadPage(p);
  }

  onMarkRead(id: number): void {
    this.api.markRead(id).subscribe(() => {
      const n = this.notifications.find(n => n.id === id);
      if (n) { n.isRead = true; this.applyFilters(); }
      this.polling.refresh();
    });
  }

  onDelete(id: number): void {
    this.api.delete(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.applyFilters();
      this.polling.refresh();
    });
  }

  markAllRead(): void {
    const uid = this.auth.getCurrentUserId();
    if (!uid) return;
    this.api.markAllRead(uid).subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.applyFilters();
      this.polling.refresh();
    });
  }
}

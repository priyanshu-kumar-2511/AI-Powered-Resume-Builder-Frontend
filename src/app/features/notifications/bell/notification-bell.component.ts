import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { Subscription }               from 'rxjs';
import { NotificationPollingService } from '../services/notification-polling.service';
import { NotificationPanelComponent } from '../panel/notification-panel.component';
import { AuthService }                from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, NotificationPanelComponent],
  template: `
    @if (auth.isLoggedIn() && !auth.isAdmin()) {
      <div class="bell-wrapper" (click)="toggle($event)">
        <button class="bell-btn" [class.active]="panelOpen" title="Notifications">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          @if (unreadCount > 0) {
            <span class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          }
        </button>

        @if (panelOpen) {
          <div class="panel-wrapper" (click)="$event.stopPropagation()">
            <app-notification-panel (close)="panelOpen = false" />
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .bell-wrapper { position: relative; }

    .bell-btn {
      position: relative; background: none; border: none; cursor: pointer;
      color: var(--text-secondary); padding: 6px;
      border-radius: 8px; display: flex; align-items: center;
      transition: color 0.2s, background 0.2s;
    }
    .bell-btn:hover, .bell-btn.active {
      color: var(--text-primary); background: var(--bg-surface);
    }
    .badge {
      position: absolute; top: 0; right: 0;
      min-width: 16px; height: 16px;
      background: #ef4444; color: #fff;
      font-size: 0.6rem; font-weight: 700;
      border-radius: 8px; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--bg-card, #080b12);
      line-height: 1;
    }

    .panel-wrapper {
      position: absolute; top: calc(100% + 12px); right: 0;
      z-index: 200;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  auth     = inject(AuthService);
  polling  = inject(NotificationPollingService);

  unreadCount = 0;
  panelOpen   = false;

  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.sub = this.polling.unreadCount$.subscribe(c => this.unreadCount = c);
    if (this.auth.isLoggedIn() && !this.auth.isAdmin()) {
      this.polling.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(e: Event): void {
    e.stopPropagation();
    this.panelOpen = !this.panelOpen;
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.panelOpen) this.panelOpen = false;
  }
}

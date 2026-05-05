import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, interval, EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { NotificationApiService } from './notification-api.service';
import { AuthService } from '../../../core/services/auth.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationPollingService implements OnDestroy {
  private api  = inject(NotificationApiService);
  private auth = inject(AuthService);

  private _unreadCount$ = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this._unreadCount$.asObservable();

  private pollSub: Subscription | null = null;

  /** Call once after successful login. */
  startPolling(): void {
    if (this.pollSub) return;                     // already running

    // Immediate first fetch, then every 30 s
    this.fetchCount();
    this.pollSub = interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => {
          const uid = this.auth.getCurrentUserId();
          if (!uid) return EMPTY;
          return this.api.getUnreadCount(uid).pipe(catchError(() => EMPTY));
        })
      )
      .subscribe(count => this._unreadCount$.next(count));
  }

  /** Call on logout. */
  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this._unreadCount$.next(0);
  }

  /** Force an immediate refresh (e.g. after marking notifications read). */
  refresh(): void {
    this.fetchCount();
  }

  private fetchCount(): void {
    const uid = this.auth.getCurrentUserId();
    if (!uid) return;
    this.api.getUnreadCount(uid).pipe(catchError(() => EMPTY))
      .subscribe(count => this._unreadCount$.next(count));
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}

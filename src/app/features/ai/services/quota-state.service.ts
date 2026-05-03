import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QuotaInfo } from '../models/ai.models';

/**
 * State management service for handling the user's AI quotas (Summary and ATS).
 * Uses RxJS BehaviorSubject to broadcast quota updates across the frontend.
 */
@Injectable({ providedIn: 'root' })
export class QuotaStateService {
  private quota$ = new BehaviorSubject<QuotaInfo>({
    remainingSummary: 10,
    summaryLimit: 10,
    remainingAts: 3,
    atsLimit: 3,
    isPremium: false
  });

  readonly quota = this.quota$.asObservable();

  /**
   * Overwrites the current quota state with fresh data from the backend.
   * @param q The new quota information.
   */
  setQuota(q: QuotaInfo): void {
    this.quota$.next(q);
  }

  /**
   * Decrements the remaining summary generation quota by 1.
   * Prevents the value from dropping below 0.
   */
  decrementSummary(): void {
    const cur = this.quota$.value;
    this.quota$.next({ ...cur, remainingSummary: Math.max(0, cur.remainingSummary - 1) });
  }

  /**
   * Decrements the remaining ATS check quota by 1.
   * Prevents the value from dropping below 0.
   */
  decrementAts(): void {
    const cur = this.quota$.value;
    this.quota$.next({ ...cur, remainingAts: Math.max(0, cur.remainingAts - 1) });
  }

  /**
   * Retrieves a synchronous snapshot of the current quota values.
   * Useful for immediate checks without subscribing.
   * @returns The current QuotaInfo snapshot.
   */
  getSnapshot(): QuotaInfo {
    return this.quota$.value;
  }
}

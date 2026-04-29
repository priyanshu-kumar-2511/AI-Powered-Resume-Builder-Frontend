import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QuotaInfo } from '../models/ai.models';

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

  setQuota(q: QuotaInfo): void {
    this.quota$.next(q);
  }

  decrementSummary(): void {
    const cur = this.quota$.value;
    this.quota$.next({ ...cur, remainingSummary: Math.max(0, cur.remainingSummary - 1) });
  }

  decrementAts(): void {
    const cur = this.quota$.value;
    this.quota$.next({ ...cur, remainingAts: Math.max(0, cur.remainingAts - 1) });
  }

  getSnapshot(): QuotaInfo {
    return this.quota$.value;
  }
}

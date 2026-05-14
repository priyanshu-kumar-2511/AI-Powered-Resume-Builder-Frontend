import { TestBed } from '@angular/core/testing';
import { QuotaStateService } from './quota-state.service';
import { QuotaInfo } from '../models/ai.models';

describe('QuotaStateService', () => {
  let service: QuotaStateService;
  let capturedQuota: QuotaInfo | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotaStateService);
  });

  it('should be created with default quota values', () => {
    expect(service).toBeTruthy();
    const snap = service.getSnapshot();
    expect(snap.remainingSummary).toBe(10);
    expect(snap.summaryLimit).toBe(10);
    expect(snap.remainingAts).toBe(3);
    expect(snap.atsLimit).toBe(3);
    expect(snap.isPremium).toBeFalse();
  });

  it('should emit default quota immediately on subscribe', (done) => {
    service.quota.subscribe(q => {
      expect(q.remainingSummary).toBe(10);
      done();
    });
  });

  it('should update quota via setQuota()', () => {
    const newQuota: QuotaInfo = {
      remainingSummary: 7,
      summaryLimit: 10,
      remainingAts: 2,
      atsLimit: 3,
      isPremium: true
    };
    service.setQuota(newQuota);
    const snap = service.getSnapshot();
    expect(snap.remainingSummary).toBe(7);
    expect(snap.isPremium).toBeTrue();
  });

  it('should decrement remainingSummary via decrementSummary()', () => {
    service.decrementSummary();
    expect(service.getSnapshot().remainingSummary).toBe(9);

    service.decrementSummary();
    expect(service.getSnapshot().remainingSummary).toBe(8);
  });

  it('should not decrement remainingSummary below 0', () => {
    const zeroQuota: QuotaInfo = { ...service.getSnapshot(), remainingSummary: 0 };
    service.setQuota(zeroQuota);
    service.decrementSummary();
    expect(service.getSnapshot().remainingSummary).toBe(0);
  });

  it('should decrement remainingAts via decrementAts()', () => {
    service.decrementAts();
    expect(service.getSnapshot().remainingAts).toBe(2);

    service.decrementAts();
    expect(service.getSnapshot().remainingAts).toBe(1);
  });

  it('should not decrement remainingAts below 0', () => {
    const zeroQuota: QuotaInfo = { ...service.getSnapshot(), remainingAts: 0 };
    service.setQuota(zeroQuota);
    service.decrementAts();
    expect(service.getSnapshot().remainingAts).toBe(0);
  });

  it('should emit updated quota on setQuota via observable', (done) => {
    const values: QuotaInfo[] = [];
    service.quota.subscribe(q => values.push(q));

    service.setQuota({ ...service.getSnapshot(), remainingSummary: 3 });

    expect(values.length).toBe(2); // initial + setQuota
    expect(values[1].remainingSummary).toBe(3);
    done();
  });

  it('getSnapshot() should return synchronous current value', () => {
    service.decrementSummary();
    const snap = service.getSnapshot();
    expect(snap.remainingSummary).toBe(9);
  });
});

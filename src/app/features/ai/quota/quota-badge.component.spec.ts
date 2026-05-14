import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuotaBadgeComponent } from './quota-badge.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AiApiService } from '../services/ai-api.service';
import { QuotaStateService } from '../services/quota-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { QuotaInfo } from '../models/ai.models';

describe('QuotaBadgeComponent', () => {
  let component: QuotaBadgeComponent;
  let fixture: ComponentFixture<QuotaBadgeComponent>;
  let mockAiApi: any;
  let mockQuotaState: any;
  let mockAuthService: any;
  let quotaSubject: BehaviorSubject<QuotaInfo>;

  beforeEach(async () => {
    quotaSubject = new BehaviorSubject<QuotaInfo>({
      remainingSummary: 5,
      summaryLimit: 10,
      remainingAts: 3,
      atsLimit: 3,
      isPremium: false
    });

    mockAiApi = {
      getQuota: jasmine.createSpy('getQuota').and.returnValue(of({}))
    };

    mockQuotaState = {
      quota: quotaSubject.asObservable(),
      getSnapshot: jasmine.createSpy('getSnapshot').and.returnValue(quotaSubject.value)
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(3)
    };

    await TestBed.configureTestingModule({
      imports: [QuotaBadgeComponent, RouterTestingModule],
      providers: [
        { provide: AiApiService,      useValue: mockAiApi },
        { provide: QuotaStateService, useValue: mockQuotaState },
        { provide: AuthService,       useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuotaBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and call getQuota on init', () => {
    expect(component).toBeTruthy();
    expect(mockAiApi.getQuota).toHaveBeenCalledWith('3');
  });

  it('should subscribe to quota state and populate quota', () => {
    expect(component.quota?.remainingSummary).toBe(5);
    expect(component.quota?.isPremium).toBeFalse();
  });

  it('should update quota when state emits', () => {
    quotaSubject.next({
      remainingSummary: 2,
      summaryLimit: 10,
      remainingAts: 1,
      atsLimit: 3,
      isPremium: false
    });
    expect(component.quota?.remainingSummary).toBe(2);
  });

  it('should return isCritical = false when remainingSummary > 1', () => {
    quotaSubject.next({ ...quotaSubject.value, remainingSummary: 3, isPremium: false });
    expect(component.isCritical).toBeFalse();
  });

  it('should return isCritical = true when remainingSummary <= 1', () => {
    quotaSubject.next({ ...quotaSubject.value, remainingSummary: 1, isPremium: false });
    expect(component.isCritical).toBeTrue();

    quotaSubject.next({ ...quotaSubject.value, remainingSummary: 0, isPremium: false });
    expect(component.isCritical).toBeTrue();
  });

  it('should return isCritical = false for premium users regardless of count', () => {
    quotaSubject.next({ ...quotaSubject.value, remainingSummary: 0, isPremium: true });
    expect(component.isCritical).toBeFalse();
  });

  it('should not call getQuota if userId is empty', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    mockAiApi.getQuota.calls.reset();
    component.ngOnInit();
    expect(mockAiApi.getQuota).not.toHaveBeenCalled();
  });

  it('should show premium quota for premium users', () => {
    quotaSubject.next({ ...quotaSubject.value, isPremium: true });
    expect(component.quota?.isPremium).toBeTrue();
  });
});

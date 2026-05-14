import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationPollingService } from './notification-polling.service';
import { NotificationApiService } from './notification-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('NotificationPollingService', () => {
  let service: NotificationPollingService;
  let mockApi: any;
  let mockAuth: any;

  beforeEach(() => {
    mockApi = {
      getUnreadCount: jasmine.createSpy('getUnreadCount').and.returnValue(of(5))
    };
    mockAuth = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1)
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationPollingService,
        { provide: NotificationApiService, useValue: mockApi },
        { provide: AuthService,            useValue: mockAuth }
      ]
    });
    service = TestBed.inject(NotificationPollingService);
  });

  afterEach(() => {
    service.stopPolling();
  });

  it('should fetch count immediately on startPolling', fakeAsync(() => {
    service.startPolling();
    tick(0);
    expect(mockApi.getUnreadCount).toHaveBeenCalledWith(1);
    
    let lastCount = 0;
    const sub = service.unreadCount$.subscribe(count => lastCount = count);
    expect(lastCount).toBe(5);
    sub.unsubscribe();
    service.stopPolling();
  }));

  it('should poll every 30 seconds', fakeAsync(() => {
    service.startPolling();
    mockApi.getUnreadCount.calls.reset();
    
    tick(30000);
    expect(mockApi.getUnreadCount).toHaveBeenCalled();
    
    tick(30000);
    expect(mockApi.getUnreadCount).toHaveBeenCalledTimes(2);
    
    service.stopPolling();
  }));

  it('should reset count on stopPolling', () => {
    service.startPolling();
    service.stopPolling();
    service.unreadCount$.subscribe(count => expect(count).toBe(0));
  });

  it('should handle API errors by ignoring them (EMPTY)', () => {
    mockApi.getUnreadCount.and.returnValue(throwError(() => new Error('API Fail')));
    service.refresh();
    service.unreadCount$.subscribe(count => expect(count).toBe(0));
  });

  it('should return early if startPolling is called while already polling', fakeAsync(() => {
    service.startPolling();
    mockApi.getUnreadCount.calls.reset();
    service.startPolling(); // second call
    expect(mockApi.getUnreadCount).not.toHaveBeenCalled();
    service.stopPolling();
  }));

  it('should return EMPTY from interval switchMap if !uid', fakeAsync(() => {
    service.startPolling();
    mockAuth.getCurrentUserId.and.returnValue(null);
    mockApi.getUnreadCount.calls.reset();
    tick(30000);
    expect(mockApi.getUnreadCount).not.toHaveBeenCalled();
    service.stopPolling();
  }));

  it('should return early from fetchCount if !uid', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    service.refresh();
    expect(mockApi.getUnreadCount).not.toHaveBeenCalled();
  });

  it('should clean up on ngOnDestroy', () => {
    spyOn(service, 'stopPolling');
    service.ngOnDestroy();
    expect(service.stopPolling).toHaveBeenCalled();
  });
});

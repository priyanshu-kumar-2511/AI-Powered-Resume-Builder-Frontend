import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationPanelComponent } from './notification-panel.component';
import { NotificationApiService } from '../services/notification-api.service';
import { NotificationPollingService } from '../services/notification-polling.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-notification-item', standalone: true, template: '' })
class MockNotificationItemComponent {
  @Input() notification: any;
  @Output() markRead = new EventEmitter<number>();
}

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;
  let mockApi: any;
  let mockPolling: any;
  let mockAuth: any;

  beforeEach(async () => {
    mockApi = {
      getByRecipient: jasmine.createSpy('getByRecipient').and.returnValue(of({ content: [{ id: 1, isRead: false }], totalElements: 1 })),
      markRead:       jasmine.createSpy('markRead').and.returnValue(of({})),
      markAllRead:    jasmine.createSpy('markAllRead').and.returnValue(of({}))
    };
    mockPolling = { refresh: jasmine.createSpy('refresh') };
    mockAuth = { getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(123) };

    await TestBed.configureTestingModule({
      imports: [NotificationPanelComponent, RouterTestingModule],
      providers: [
        { provide: NotificationApiService,     useValue: mockApi },
        { provide: NotificationPollingService, useValue: mockPolling },
        { provide: AuthService,                useValue: mockAuth }
      ]
    })
    .overrideComponent(NotificationPanelComponent, {
      set: {
        imports: [MockNotificationItemComponent, RouterTestingModule]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
  });

  it('should load notifications on init', () => {
    fixture.detectChanges();
    expect(mockAuth.getCurrentUserId).toHaveBeenCalled();
    expect(mockApi.getByRecipient).toHaveBeenCalledWith(123, 0, 5);
    expect(component.notifications.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle load error', () => {
    mockApi.getByRecipient.and.returnValue(throwError(() => new Error('Fail')));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(component.notifications.length).toBe(0);
  });

  it('should mark single notification as read', () => {
    fixture.detectChanges();
    component.onMarkRead(1);
    expect(mockApi.markRead).toHaveBeenCalledWith(1);
    expect(component.notifications[0].isRead).toBeTrue();
    expect(mockPolling.refresh).toHaveBeenCalled();
  });

  it('should mark all notifications as read', () => {
    fixture.detectChanges();
    component.markAllRead();
    expect(mockApi.markAllRead).toHaveBeenCalledWith(123);
    expect(component.notifications[0].isRead).toBeTrue();
    expect(mockPolling.refresh).toHaveBeenCalled();
  });

  it('should return early in load() if no userId', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    component.load();
    expect(component.loading).toBeFalse();
    expect(mockApi.getByRecipient).not.toHaveBeenCalled();
  });

  it('should return early in markAllRead() if no userId', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    component.markAllRead();
    expect(mockApi.markAllRead).not.toHaveBeenCalled();
  });
});

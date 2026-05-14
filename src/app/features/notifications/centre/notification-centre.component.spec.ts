import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationCentreComponent } from './notification-centre.component';
import { NotificationApiService } from '../services/notification-api.service';
import { NotificationPollingService } from '../services/notification-polling.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

@Component({ selector: 'app-notification-item', standalone: true, template: '' })
class MockNotificationItemComponent {
  @Input() notification: any;
  @Input() showDelete: boolean = false;
  @Output() markRead = new EventEmitter<number>();
  @Output() deleted = new EventEmitter<number>();
}

describe('NotificationCentreComponent', () => {
  let component: NotificationCentreComponent;
  let fixture: ComponentFixture<NotificationCentreComponent>;
  let mockApi: any;
  let mockPolling: any;
  let mockAuth: any;

  const mockNotifs = [
    { id: 1, isRead: false, type: 'SUCCESS' },
    { id: 2, isRead: true, type: 'INFO' }
  ];

  beforeEach(async () => {
    mockApi = {
      getByRecipient: jasmine.createSpy('getByRecipient').and.returnValue(of({
        content: mockNotifs,
        number: 0,
        totalPages: 2
      })),
      markRead: jasmine.createSpy('markRead').and.returnValue(of({})),
      markAllRead: jasmine.createSpy('markAllRead').and.returnValue(of({})),
      delete: jasmine.createSpy('delete').and.returnValue(of({}))
    };
    mockPolling = {
      refresh: jasmine.createSpy('refresh'),
      unreadCount$: of(5)
    };
    mockAuth = { getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(123) };

    await TestBed.configureTestingModule({
      imports: [NotificationCentreComponent, RouterTestingModule, FormsModule],
      providers: [
        { provide: NotificationApiService, useValue: mockApi },
        { provide: NotificationPollingService, useValue: mockPolling },
        { provide: AuthService, useValue: mockAuth }
      ]
    })
    .overrideComponent(NotificationCentreComponent, {
      set: {
        imports: [FormsModule, MockNavbarComponent, MockNotificationItemComponent, RouterTestingModule]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationCentreComponent);
    component = fixture.componentInstance;
  });

  it('should load first page on init', () => {
    fixture.detectChanges();
    expect(mockApi.getByRecipient).toHaveBeenCalledWith(123, 0, 20);
    expect(component.notifications.length).toBe(2);
    expect(component.totalUnread).toBe(5);
  });

  it('should handle load error', () => {
    mockApi.getByRecipient.and.returnValue(throwError(() => new Error('Fail')));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
  });

  it('should filter by type', () => {
    fixture.detectChanges();
    component.typeFilter = 'SUCCESS';
    component.applyFilters();
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].type).toBe('SUCCESS');
    
    component.typeFilter = 'INFO';
    component.applyFilters();
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].type).toBe('INFO');
  });

  it('should navigate pages', () => {
    fixture.detectChanges();
    component.goPage(1);
    expect(mockApi.getByRecipient).toHaveBeenCalledWith(123, 1, 20);
  });

  it('should mark as read', () => {
    fixture.detectChanges();
    component.onMarkRead(1);
    expect(mockApi.markRead).toHaveBeenCalledWith(1);
    expect(mockPolling.refresh).toHaveBeenCalled();
  });

  it('should delete notification', () => {
    fixture.detectChanges();
    component.onDelete(1);
    expect(mockApi.delete).toHaveBeenCalledWith(1);
    expect(component.notifications.length).toBe(1);
    expect(mockPolling.refresh).toHaveBeenCalled();
  });

  it('should mark all read', () => {
    fixture.detectChanges();
    component.markAllRead();
    expect(mockApi.markAllRead).toHaveBeenCalledWith(123);
    expect(component.notifications.every(n => n.isRead)).toBeTrue();
  });

  it('should handle no userId in loadPage', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    component.loadPage(0);
    expect(component.loading).toBeFalse();
    expect(mockApi.getByRecipient).not.toHaveBeenCalled();
  });

  it('should handle no userId in markAllRead', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    component.markAllRead();
    expect(mockApi.markAllRead).not.toHaveBeenCalled();
  });
});

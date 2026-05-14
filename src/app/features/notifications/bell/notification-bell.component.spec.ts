import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationPollingService } from '../services/notification-polling.service';
import { NotificationPanelComponent } from '../panel/notification-panel.component';
import { of, Subscription } from 'rxjs';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  template: ''
})
class MockNotificationPanelComponent {}

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let mockAuth: any;
  let mockPolling: any;

  beforeEach(async () => {
    mockAuth = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
    };

    mockPolling = {
      startPolling: jasmine.createSpy('startPolling'),
      unreadCount$: of(0)
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: NotificationPollingService, useValue: mockPolling }
      ]
    })
    .overrideComponent(NotificationBellComponent, {
      remove: { imports: [NotificationPanelComponent] },
      add: { imports: [MockNotificationPanelComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should subscribe to unreadCount$ on init', () => {
    mockPolling.unreadCount$ = of(5);
    fixture.detectChanges();
    expect(component.unreadCount).toBe(5);
  });

  it('should start polling if logged in and not admin', () => {
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.isAdmin.and.returnValue(false);
    fixture.detectChanges();
    expect(mockPolling.startPolling).toHaveBeenCalled();
  });

  it('should NOT start polling if not logged in', () => {
    mockAuth.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(mockPolling.startPolling).not.toHaveBeenCalled();
  });

  it('should NOT start polling if admin', () => {
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.isAdmin.and.returnValue(true);
    fixture.detectChanges();
    expect(mockPolling.startPolling).not.toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const sub = (component as any).sub;
    spyOn(sub, 'unsubscribe');
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('should toggle panelOpen on toggle()', () => {
    fixture.detectChanges();
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    
    expect(component.panelOpen).toBeFalse();
    component.toggle(event);
    expect(component.panelOpen).toBeTrue();
    expect(event.stopPropagation).toHaveBeenCalled();
    
    component.toggle(event);
    expect(component.panelOpen).toBeFalse();
  });

  it('should close panel on document click if open', () => {
    fixture.detectChanges();
    component.panelOpen = true;
    component.onDocClick();
    expect(component.panelOpen).toBeFalse();
  });

  it('should do nothing on document click if closed', () => {
    fixture.detectChanges();
    component.panelOpen = false;
    component.onDocClick();
    expect(component.panelOpen).toBeFalse();
  });

  it('should format badge count correctly', () => {
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.isAdmin.and.returnValue(false);
    mockPolling.unreadCount$ = of(150);
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toBe('99+');
    
    mockPolling.unreadCount$ = of(50);
    // Manually trigger subscription update if needed or just re-init
    component.unreadCount = 50;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.badge').textContent).toBe('50');
  });
});

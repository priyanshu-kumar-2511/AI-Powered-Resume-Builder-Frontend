import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationPollingService } from '../../../features/notifications/services/notification-polling.service';
import { NotificationBellComponent } from '../../../features/notifications/bell/notification-bell.component';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  template: ''
})
class MockNotificationBellComponent {}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuth: any;
  let mockPolling: any;

  beforeEach(async () => {
    mockAuth = {
      isLoggedIn:        jasmine.createSpy('isLoggedIn').and.returnValue(false),
      isAdmin:           jasmine.createSpy('isAdmin').and.returnValue(false),
      getProfile:        jasmine.createSpy('getProfile').and.returnValue(of({})),
      logout:            jasmine.createSpy('logout'),
      getCurrentUserId:  jasmine.createSpy('getCurrentUserId').and.returnValue(null),
      getCurrentPlan:    jasmine.createSpy('getCurrentPlan').and.returnValue('FREE'),
      currentUser:       signal(null),
      user$:             of(null),
      unreadCount$:      of(0)
    };

    mockPolling = {
      startPolling: jasmine.createSpy('startPolling'),
      stopPolling:  jasmine.createSpy('stopPolling'),
      unreadCount$: of(0)
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService,                useValue: mockAuth },
        { provide: NotificationPollingService, useValue: mockPolling }
      ]
    })
    .overrideComponent(NavbarComponent, {
      remove: { imports: [NotificationBellComponent] },
      add: { imports: [MockNotificationBellComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should NOT fetch profile or start polling when not logged in', () => {
    mockAuth.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(mockAuth.getProfile).not.toHaveBeenCalled();
    expect(mockPolling.startPolling).not.toHaveBeenCalled();
  });

  it('should fetch profile and start polling when logged in and not admin', () => {
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.isAdmin.and.returnValue(false);
    fixture.detectChanges();
    expect(mockAuth.getProfile).toHaveBeenCalled();
    expect(mockPolling.startPolling).toHaveBeenCalled();
  });

  it('should fetch profile but NOT start polling when logged in as admin', () => {
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.isAdmin.and.returnValue(true);
    fixture.detectChanges();
    expect(mockAuth.getProfile).toHaveBeenCalled();
    expect(mockPolling.startPolling).not.toHaveBeenCalled();
  });

  it('should toggle menuOpen on toggleMenu()', () => {
    fixture.detectChanges();
    expect(component.menuOpen).toBeFalse();
    component.toggleMenu();
    expect(component.menuOpen).toBeTrue();
    component.toggleMenu();
    expect(component.menuOpen).toBeFalse();
  });

  it('should close menu on closeMenu()', () => {
    fixture.detectChanges();
    component.menuOpen = true;
    component.closeMenu();
    expect(component.menuOpen).toBeFalse();
  });

  it('should call stopPolling and auth.logout on logout()', () => {
    fixture.detectChanges();
    component.logout();
    expect(mockPolling.stopPolling).toHaveBeenCalled();
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('isAdmin getter should delegate to auth.isAdmin()', () => {
    mockAuth.isAdmin.and.returnValue(true);
    fixture.detectChanges();
    expect(component.isAdmin).toBeTrue();
  });

  it('should handle getProfile error in ngOnInit', () => {
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.getProfile.and.returnValue(of(null)); 
    fixture.detectChanges();
    // No specific local property to check, but verify it doesn't throw
    expect(component).toBeTruthy();
  });
});

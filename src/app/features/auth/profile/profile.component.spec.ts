import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { of, throwError } from 'rxjs';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ConfirmService } from '../../../shared/services/confirm.service';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuth: any;
  let mockPayment: any;

  beforeEach(async () => {
    mockAuth = {
      getProfile:    jasmine.createSpy('getProfile').and.returnValue(of({ fullName: 'John Doe', email: 'john@example.com' })),
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of({ message: 'Success' })),
      deleteAccount: jasmine.createSpy('deleteAccount').and.returnValue(of({})),
      logout:        jasmine.createSpy('logout'),
      refreshToken:  jasmine.createSpy('refreshToken').and.returnValue(of({ token: 'new' }))
    };
    mockPayment = { 
      getStatus: jasmine.createSpy('getStatus').and.returnValue(of({ status: 'ACTIVE' })), 
      cancelSubscription: jasmine.createSpy('cancelSubscription').and.returnValue(of({ message: 'Cancelled' })) 
    };

    const mockConfirm = {
      ask: jasmine.createSpy('ask').and.returnValue(Promise.resolve(true)),
      alert: jasmine.createSpy('alert').and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule, CommonModule],
      providers: [
        { provide: AuthService,    useValue: mockAuth },
        { provide: PaymentService, useValue: mockPayment },
        { provide: ConfirmService, useValue: mockConfirm },
        DatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ProfileComponent, {
      set: { imports: [ReactiveFormsModule, CommonModule, MockNavbarComponent, RouterTestingModule], schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and load profile', () => {
    fixture.detectChanges();
    expect(mockAuth.getProfile).toHaveBeenCalled();
    expect(component.profile?.fullName).toBe('John Doe');
  });

  it('should calculate initials', () => {
    component.profile = { fullName: 'Jane Doe' } as any;
    expect(component.initials).toBe('JD');
  });

  it('should save profile successfully', () => {
    fixture.detectChanges();
    component.editMode = true;
    component.form.patchValue({ fullName: 'Updated Name' });
    component.saveProfile();
    expect(mockAuth.updateProfile).toHaveBeenCalled();
    expect(component.editMode).toBeFalse();
  });

  it('should delete account after confirmation', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
    await component.deleteAccount();
    expect(mockAuth.deleteAccount).toHaveBeenCalled();
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('should handle update error', fakeAsync(() => {
    mockAuth.updateProfile.and.returnValue(throwError(() => new Error('Fail')));
    fixture.detectChanges();
    component.editMode = true;
    component.saveProfile();
    expect(component.error).toBeTruthy();
    tick(4000);
    expect(component.error).toBe('');
  }));

  it('should not save profile if form is invalid', () => {
    fixture.detectChanges();
    component.form.patchValue({ fullName: '' }); // Invalid
    component.saveProfile();
    expect(mockAuth.updateProfile).not.toHaveBeenCalled();
  });

  it('should handle getProfile error on init', () => {
    mockAuth.getProfile.and.returnValue(throwError(() => new Error('Init Fail')));
    fixture.detectChanges();
    expect(component.error).toContain('Failed to load profile');
    expect(component.loading).toBeFalse();
  });

  it('should not delete account if not confirmed', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(false));
    fixture.detectChanges();
    await component.deleteAccount();
    expect(mockAuth.deleteAccount).not.toHaveBeenCalled();
  });

  it('should handle delete account error', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    mockAuth.deleteAccount.and.returnValue(throwError(() => new Error('Delete Fail')));
    fixture.detectChanges();
    await component.deleteAccount();
    expect(component.error).toBeTruthy();
    expect(component.deletingAccount).toBeFalse();
  });

  it('should handle cancelSubscription if not confirmed', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(false));
    fixture.detectChanges();
    await component.cancelSubscription();
    expect(mockPayment.cancelSubscription).not.toHaveBeenCalled();
  });

  it('should handle cancelSubscription if confirmed', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
    await component.cancelSubscription();
    expect(mockPayment.cancelSubscription).toHaveBeenCalled();
    expect(component.success).toBe('Cancelled');
  });

  it('should handle cancelSubscription error', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    mockPayment.cancelSubscription.and.returnValue(throwError(() => new Error('Cancel Fail')));
    fixture.detectChanges();
    await component.cancelSubscription();
    expect(component.error).toBeTruthy();
  });

  it('should calculate canShowCancelSubscription correctly', () => {
    component.profile = { subscriptionPlan: 'FREE' } as any;
    expect(component.canShowCancelSubscription).toBeFalse();

    component.profile = { subscriptionPlan: 'PREMIUM' } as any;
    component.subscription = null;
    expect(component.canShowCancelSubscription).toBeTrue();

    component.subscription = { status: 'CANCELLED' } as any;
    expect(component.canShowCancelSubscription).toBeFalse();
    
    component.subscription = { status: 'ACTIVE' } as any;
    expect(component.canShowCancelSubscription).toBeTrue();
  });

  it('should cancel edit and revert form', () => {
    fixture.detectChanges();
    component.profile = { fullName: 'Original', mobileNumber: '', age: null } as any;
    component.editMode = true;
    component.form.patchValue({ fullName: 'Changed' });
    
    component.cancelEdit();
    
    expect(component.editMode).toBeFalse();
    expect(component.form.value.fullName).toBe('Original');
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      initiateRegistration: jasmine.createSpy('initiateRegistration').and.returnValue(of({ message: 'OTP sent' })),
      verifyRegistrationOtp: jasmine.createSpy('verifyRegistrationOtp').and.returnValue(of({ message: 'Verified' })),
      register: jasmine.createSpy('register').and.returnValue(of({ message: 'Registered' }))
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should prefill mobile number with +91', () => {
    expect(component.mobileNumber.value).toBe('+91');
  });

  it('should calculate password strength', () => {
    component.form.patchValue({ password: 'pass' });
    expect(component.passwordStrength).toBe(0);

    component.form.patchValue({ password: 'Password123!' });
    expect(component.passwordStrength).toBe(4);
    expect(component.strengthLabel).toBe('Strong');
    expect(component.strengthClass).toBe('strong');
  });

  it('should send OTP and move to step 2', () => {
    component.form.patchValue({
      fullName: 'John Doe',
      age: 25,
      mobileNumber: '+919876543210',
      email: 'test@test.com'
    });

    component.sendOtp();
    expect(mockAuthService.initiateRegistration).toHaveBeenCalled();
    expect(component.step).toBe(2);
    expect(component.resendCountdown).toBe(30);
  });

  it('should handle initiateRegistration error', () => {
    mockAuthService.initiateRegistration.and.returnValue(throwError(() => ({ error: { message: 'Email in use' } })));
    component.form.patchValue({ fullName: 'John', age: 25, mobileNumber: '+919876543210', email: 't@t.com' });
    component.sendOtp();
    expect(component.error).toEqual('Email in use');
    expect(component.step).toBe(1);
  });

  it('should verify OTP and move to step 3', () => {
    component.step = 2;
    component.form.patchValue({ otp: '123456', email: 't@t.com' });
    component.verifyOtp();
    
    expect(mockAuthService.verifyRegistrationOtp).toHaveBeenCalledWith('t@t.com', '123456');
    expect(component.step).toBe(3);
  });

  it('should handle verifyOtp error', () => {
    component.step = 2;
    mockAuthService.verifyRegistrationOtp.and.returnValue(throwError(() => ({ error: { message: 'Invalid OTP' } })));
    component.form.patchValue({ otp: '123456', email: 't@t.com' });
    component.verifyOtp();
    expect(component.error).toEqual('Invalid OTP');
    expect(component.step).toBe(2);
  });

  it('should submit registration and navigate to login', fakeAsync(() => {
    component.step = 3;
    component.form.patchValue({
      fullName: 'John Doe', age: 25, mobileNumber: '+919876543210', email: 'test@test.com',
      otp: '123456', username: 'johndoe', password: 'Password123!'
    });

    component.submit();
    expect(mockAuthService.register).toHaveBeenCalled();
    expect(component.success).toEqual('Registered');
    
    tick(2000); // wait for setTimeout
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle registration error', () => {
    component.step = 3;
    mockAuthService.register.and.returnValue(throwError(() => ({ error: { message: 'Username taken' } })));
    component.form.patchValue({
      fullName: 'John', age: 25, mobileNumber: '+919876543210', email: 't@t.com',
      otp: '123456', username: 'johndoe', password: 'Password123!'
    });
    component.submit();
    expect(component.error).toEqual('Username taken');
  });

  it('should resend OTP if countdown is 0', () => {
    component.resendCountdown = 0;
    component.form.patchValue({ fullName: 'John', age: 25, mobileNumber: '+919876543210', email: 't@t.com' });
    component.resendOtp();
    expect(mockAuthService.initiateRegistration).toHaveBeenCalled();
    expect(component.resendCountdown).toBe(30);
  });

  it('should test strength labels and classes for all ranges', () => {
    // Score 1 (Weak)
    component.form.patchValue({ password: 'a' });
    expect(component.strengthLabel).toBe('Weak');
    expect(component.strengthClass).toBe('weak');

    // Score 2 (Fair)
    component.form.patchValue({ password: 'Password' }); // len(8) + Caps -> score 2
    expect(component.strengthLabel).toBe('Fair');
    expect(component.strengthClass).toBe('medium');

    // Score 3 (Good)
    component.form.patchValue({ password: 'Password1' }); // len(8) + Caps + num -> score 3
    expect(component.strengthLabel).toBe('Good');
    expect(component.strengthClass).toBe('strong');
  });

  it('should abort sendOtp if form is invalid', () => {
    component.form.patchValue({ fullName: '' });
    component.sendOtp();
    expect(mockAuthService.initiateRegistration).not.toHaveBeenCalled();
  });

  it('should abort verifyOtp if form is invalid', () => {
    component.form.patchValue({ otp: '' });
    component.verifyOtp();
    expect(mockAuthService.verifyRegistrationOtp).not.toHaveBeenCalled();
  });

  it('should abort submit if form is invalid', () => {
    component.form.patchValue({ username: '' });
    component.submit();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should abort resendOtp if countdown > 0', () => {
    component.resendCountdown = 10;
    component.resendOtp();
    expect(mockAuthService.initiateRegistration).not.toHaveBeenCalled();
  });

  it('should handle resendOtp error', () => {
    component.resendCountdown = 0;
    mockAuthService.initiateRegistration.and.returnValue(throwError(() => ({ error: { message: 'Resend Failed' } })));
    component.form.patchValue({ fullName: 'John', age: 25, mobileNumber: '+919876543210', email: 't@t.com' });
    component.resendOtp();
    expect(component.error).toEqual('Resend Failed');
  });

  it('should preserve +91 prefix while typing mobile number', () => {
    component.form.patchValue({ mobileNumber: '9876543210' });
    component.onMobileNumberInput();
    expect(component.mobileNumber.value).toBe('+919876543210');

    component.form.patchValue({ mobileNumber: '' });
    component.onMobileNumberInput();
    expect(component.mobileNumber.value).toBe('+91');
  });

  it('should clear interval on ngOnDestroy', fakeAsync(() => {
    component.startCountdown();
    expect((component as any).countdownInterval).toBeTruthy();
    component.ngOnDestroy();
    
    // Using tick to allow any pending items to flush without error since it's cleared
    tick(2000); 
    // And component can be safely destroyed without leaving timers behind
  }));
});

import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../shared/utils/http-error.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnDestroy {
  private readonly mobilePrefix = '+91';
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    fullName:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    age:          [null as number | null, [Validators.required, Validators.min(18), Validators.max(120)]],
    mobileNumber: [this.mobilePrefix, [Validators.required, Validators.pattern(/^\+91[0-9]{10}$/)]],
    email:        ['', [Validators.required, Validators.email]],
    otp:          ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    username:     ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
    password:     ['', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]]
  });

  loading  = false;
  error    = '';
  success  = '';
  showPwd  = false;
  step     = 1; // 1 = Personal Details, 2 = OTP Verification, 3 = Credentials Selection

  resendCountdown = 0;
  private countdownInterval: any;

  get passwordStrength(): number {
    const pwd = this.password.value || '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;
    return score;
  }

  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  }

  get strengthClass(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'weak';
    if (s <= 2) return 'medium';
    return 'strong';
  }

  sendOtp() {
    const controls = ['fullName', 'age', 'mobileNumber', 'email'];
    controls.forEach(c => this.form.get(c)!.markAsTouched());
    const valid = controls.every(c => this.form.get(c)!.valid);
    if (!valid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      fullName: this.fullName.value || '',
      age: Number(this.age.value),
      mobileNumber: this.mobileNumber.value || '',
      email: this.email.value || ''
    };

    this.auth.initiateRegistration(payload).subscribe({
      next: (res) => {
        this.success = res.message || 'Verification OTP sent to your email';
        this.loading = false;
        this.step = 2;
        this.startCountdown();
      },
      error: (e) => {
        this.error = extractErrorMessage(e, 'Failed to send OTP. Please try again.');
        this.loading = false;
      }
    });
  }

  verifyOtp() {
    this.otp.markAsTouched();
    if (this.otp.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.verifyRegistrationOtp(this.email.value || '', this.otp.value || '').subscribe({
      next: (res) => {
        this.success = res.message || 'OTP verified successfully!';
        this.loading = false;
        this.step = 3;
      },
      error: (e) => {
        this.error = extractErrorMessage(e, 'Invalid or expired OTP. Please try again.');
        this.loading = false;
      }
    });
  }

  submit() {
    const controls = ['username', 'password'];
    controls.forEach(c => this.form.get(c)!.markAsTouched());
    const valid = controls.every(c => this.form.get(c)!.valid);
    if (!valid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      fullName: this.fullName.value || '',
      age: Number(this.age.value),
      mobileNumber: this.mobileNumber.value || '',
      email: this.email.value || '',
      username: this.username.value || '',
      password: this.password.value || '',
      otp: this.otp.value || ''
    };

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.success = res.message || 'Account created successfully! Redirecting to login...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (e) => {
        this.error = extractErrorMessage(e, 'Registration failed. Please try again.');
        this.loading = false;
      }
    });
  }

  startCountdown() {
    this.resendCountdown = 30;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  resendOtp() {
    if (this.resendCountdown > 0) return;
    
    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      fullName: this.fullName.value || '',
      age: Number(this.age.value),
      mobileNumber: this.mobileNumber.value || '',
      email: this.email.value || ''
    };

    this.auth.initiateRegistration(payload).subscribe({
      next: (res) => {
        this.success = 'OTP resent successfully!';
        this.loading = false;
        this.startCountdown();
      },
      error: (e) => {
        this.error = extractErrorMessage(e, 'Failed to resend OTP. Please try again.');
        this.loading = false;
      }
    });
  }

  onMobileNumberInput() {
    const rawValue = `${this.mobileNumber.value ?? ''}`;
    let digitsOnly = rawValue.replace(/\D/g, '');

    if (rawValue.trim().startsWith(this.mobilePrefix)) {
      digitsOnly = digitsOnly.slice(2);
    } else if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
      digitsOnly = digitsOnly.slice(2);
    }

    const normalizedValue = `${this.mobilePrefix}${digitsOnly.slice(0, 10)}`;

    if (rawValue !== normalizedValue) {
      this.mobileNumber.setValue(normalizedValue, { emitEvent: false });
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  get fullName()     { return this.form.get('fullName')!; }
  get age()          { return this.form.get('age')!; }
  get mobileNumber() { return this.form.get('mobileNumber')!; }
  get email()        { return this.form.get('email')!; }
  get otp()          { return this.form.get('otp')!; }
  get username()     { return this.form.get('username')!; }
  get password()     { return this.form.get('password')!; }
}

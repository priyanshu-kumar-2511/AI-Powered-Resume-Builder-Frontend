import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  // Step 1: email (AuthService maps this to both `username` and `email` for the backend)
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Step 2: OTP + new password
  otpForm = this.fb.group({
    otp:         ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]]
  });

  step    = 1;
  loading = false;
  error   = '';
  success = '';
  showPwd = false;

  initiateReset() {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading = true; this.error = '';

    // FIX: AuthService.initiatePasswordReset now sends email as both `username` and `email`
    // to satisfy the backend PasswordResetInitiateRequest DTO validation.
    this.auth.initiatePasswordReset({ email: this.emailForm.value.email! }).subscribe({
      next: (res) => { this.success = res.message; this.loading = false; this.step = 2; },
      error: (e) => { this.error = e?.error?.message || 'Failed to send OTP.'; this.loading = false; }
    });
  }

  verifyReset() {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading = true; this.error = ''; this.success = '';

    // FIX: AuthService.verifyPasswordReset maps `email` → `identifier` for backend.
    this.auth.verifyPasswordReset({
      email:       this.emailForm.value.email!,
      otp:         this.otpForm.value.otp!,
      newPassword: this.otpForm.value.newPassword!
    }).subscribe({
      next: (res) => {
        this.success = res.message || 'Password reset! Redirecting to login...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (e) => { this.error = e?.error?.message || 'Invalid OTP or expired.'; this.loading = false; }
    });
  }

  get emailCtrl()  { return this.emailForm.get('email')!; }
  get otpCtrl()    { return this.otpForm.get('otp')!; }
  get newPwdCtrl() { return this.otpForm.get('newPassword')!; }
}

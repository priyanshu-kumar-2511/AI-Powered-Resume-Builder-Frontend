import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-username',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-username.component.html'
})
export class ForgotUsernameComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  // FIX: Backend UsernameRecoveryRequest requires BOTH email and password.
  // Added `password` field to the form so the API call succeeds.
  emailForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6)]]
  });

  step     = 1;
  loading  = false;
  error    = '';
  success  = '';
  showPwd  = false;

  initiateRecovery() {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading = true; this.error = '';

    this.auth.initiateUsernameRecovery({
      email:    this.emailForm.value.email!,
      password: this.emailForm.value.password!
    }).subscribe({
      next: (res) => { this.success = res.message; this.loading = false; this.step = 2; },
      error: (e) => { this.error = e?.error?.message || 'No account found with this email or incorrect password.'; this.loading = false; }
    });
  }

  verifyRecovery() {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading = true; this.error = ''; this.success = '';

    this.auth.verifyUsernameRecovery({
      email: this.emailForm.value.email!,
      otp:   this.otpForm.value.otp!
    }).subscribe({
      next: (res) => {
        this.success = res.message || 'Username sent to your email!';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (e) => { this.error = e?.error?.message || 'Invalid or expired OTP.'; this.loading = false; }
    });
  }

  get emailCtrl()    { return this.emailForm.get('email')!; }
  get passwordCtrl() { return this.emailForm.get('password')!; }
  get otpCtrl()      { return this.otpForm.get('otp')!; }
}

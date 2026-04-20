import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder, FormGroup, ReactiveFormsModule,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export type RecoveryMode = 'password' | 'username';
export type RecoveryStep = 'request' | 'verify' | 'done';

/** Custom validator: matches backend password-complexity regex */
function passwordComplexity(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value || '';
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(val) ? null : { complexity: true };
}

function passwordMatch(g: AbstractControl): ValidationErrors | null {
  return g.get('newPassword')?.value === g.get('confirmPassword')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatSnackBarModule],
  templateUrl: './recovery.component.html',
  styleUrl: './recovery.component.css'
})
export class RecoveryComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private auth     = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  mode: RecoveryMode = 'password';
  step: RecoveryStep = 'request';

  /* forms */
  pwRequestForm!: FormGroup;   // forgot-password step 1 : username + email
  pwVerifyForm!: FormGroup;    // forgot-password step 2 : otp + newPassword

  unRequestForm!: FormGroup;   // forgot-username step 1 : email + password
  unVerifyForm!: FormGroup;    // forgot-username step 2 : otp only

  isLoading    = false;
  errorMessage = '';
  successMessage = '';

  /** identifier cached between steps */
  private cachedIdentifier = '';

  ngOnInit(): void {
    /* read ?mode= query param so login page can link directly */
    this.route.queryParams.subscribe(p => {
      if (p['mode'] === 'username') this.mode = 'username';
      else this.mode = 'password';
    });

    this.buildForms();
  }

  private buildForms(): void {
    /* ── Forgot Password ─────────────────────────────────── */
    this.pwRequestForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email:    ['', [Validators.required, Validators.email]]
    });

    this.pwVerifyForm = this.fb.group({
      otp:             ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]],
      newPassword:     ['', [Validators.required, passwordComplexity]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });

    /* ── Forgot Username ─────────────────────────────────── */
    this.unRequestForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.unVerifyForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
    });
  }

  /** Switch mode tabs — resets everything */
  switchMode(m: RecoveryMode): void {
    this.mode = m;
    this.step = 'request';
    this.errorMessage = '';
    this.successMessage = '';
    this.cachedIdentifier = '';
    this.buildForms();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private handleError(err: any): void {
    this.isLoading = false;
    if (err.error?.errors && Array.isArray(err.error.errors)) {
      this.errorMessage = err.error.errors.map((e: any) => e.defaultMessage).join(' | ');
    } else if (typeof err.error === 'string') {
      this.errorMessage = err.error;
    } else {
      this.errorMessage = err.error?.message || 'Something went wrong. Please try again.';
    }
    this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
  }

  /* ═══════════════════════════════════════════════
     FORGOT PASSWORD HANDLERS
  ═══════════════════════════════════════════════ */
  onPwRequestOtp(): void {
    if (this.pwRequestForm.invalid) { this.pwRequestForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.clearMessages();

    const { username, email } = this.pwRequestForm.value;
    this.cachedIdentifier = username;

    this.auth.initiatePasswordReset({ username, email }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'OTP sent to your registered email.';
        this.step = 'verify';
      },
      error: (err) => this.handleError(err)
    });
  }

  onPwVerifyOtp(): void {
    if (this.pwVerifyForm.invalid) { this.pwVerifyForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.clearMessages();

    const { otp, newPassword } = this.pwVerifyForm.value;
    this.auth.verifyPasswordReset({
      identifier: this.cachedIdentifier,
      otp,
      newPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password reset successfully!';
        this.step = 'done';
        this.snackBar.open('Password updated! Redirecting to login…', 'Close', { duration: 3000 });
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => this.handleError(err)
    });
  }

  /* ═══════════════════════════════════════════════
     FORGOT USERNAME HANDLERS
  ═══════════════════════════════════════════════ */
  onUnRequestOtp(): void {
    if (this.unRequestForm.invalid) { this.unRequestForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.clearMessages();

    const { email, password } = this.unRequestForm.value;
    this.cachedIdentifier = email;

    this.auth.initiateUsernameRecovery({ email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'OTP sent to your registered email.';
        this.step = 'verify';
      },
      error: (err) => this.handleError(err)
    });
  }

  onUnVerifyOtp(): void {
    if (this.unVerifyForm.invalid) { this.unVerifyForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.clearMessages();

    const { otp } = this.unVerifyForm.value;
    this.auth.verifyUsernameRecovery({
      identifier: this.cachedIdentifier,
      otp
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Your username has been sent to your registered email.';
        this.step = 'done';
      },
      error: (err) => this.handleError(err)
    });
  }
}

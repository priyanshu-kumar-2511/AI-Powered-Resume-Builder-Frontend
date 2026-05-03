import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required]]
  });

  loading    = false;
  error      = '';
  oauthError = false;
  showPwd    = false;
  isSuspended = false;
  returnUrl  = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
    const storedReturnUrl = sessionStorage.getItem('resumeai_return_url');
    if (storedReturnUrl) {
      this.returnUrl = storedReturnUrl;
    }

    // Handle OAuth2 token on redirect back to /login?token=...
    const token = this.route.snapshot.queryParamMap.get('token')
      || this.route.snapshot.queryParamMap.get('accessToken');
    if (token) {
      localStorage.setItem('resumeai_token', token);
      this.auth.isLoggedIn.set(true);
      sessionStorage.removeItem('resumeai_return_url');
      // Load profile then redirect based on role
      this.auth.getProfile().subscribe({
        next:  () => this.redirectAfterLogin(),
        error: () => this.redirectAfterLogin()
      });
      return;
    }

    // FIX: Show a friendly message when OAuth2 fails
    const oauthError = this.route.snapshot.queryParamMap.get('oauthError');
    if (oauthError === 'true') {
      this.oauthError = true;
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = ''; this.oauthError = false;

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        // After saving token, load profile to get roles, then redirect
        this.auth.getProfile().subscribe({
          next:  () => this.redirectAfterLogin(),
          error: () => this.redirectAfterLogin()  // even on profile error, redirect
        });
      },
      error: (e) => {
        const msg = e?.error?.message || '';
        if (msg === 'ACCOUNT_SUSPENDED') {
          this.isSuspended = true;
        } else {
          this.error = msg || 'Invalid username or password.';
        }
        this.loading = false;
      }
    });
  }

  /**
   * Redirect logic after successful login:
   * - If the user has ROLE_ADMIN → go to /admin
   * - If there is a stored returnUrl → go there
   * - Otherwise → go to /dashboard
   */
  private redirectAfterLogin(): void {
    sessionStorage.removeItem('resumeai_return_url');
    if (this.auth.isAdmin()) {
      this.router.navigateByUrl('/admin');
    } else {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  googleLogin(): void {
    sessionStorage.setItem('resumeai_return_url', this.returnUrl);
    this.auth.loginWithGoogle();
  }

  linkedinLogin(): void {
    sessionStorage.setItem('resumeai_return_url', this.returnUrl);
    this.auth.loginWithLinkedIn();
  }

  get username() { return this.form.get('username')!; }
  get password() { return this.form.get('password')!; }
}

import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    // If user is already authenticated, go straight to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginPayload = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.authService.login(loginPayload).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Login Successful! Welcome back.', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 0) {
            this.errorMessage = '❌ Cannot connect to server (CORS or network issue).';
          } else if (err.error && typeof err.error === 'object') {
            const messages = Object.values(err.error) as string[];
            this.errorMessage = `[${err.status}] ${messages.join(' | ')}`;
          } else if (typeof err.error === 'string') {
            this.errorMessage = `[${err.status}] ${err.error}`;
          } else {
            this.errorMessage = `[${err.status}] Login failed. Please check your credentials.`;
          }
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /**
   * Delegates to AuthService which navigates to the relative OAuth2 path.
   * The Angular dev-proxy forwards this to the API Gateway → Auth Service.
   */
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}

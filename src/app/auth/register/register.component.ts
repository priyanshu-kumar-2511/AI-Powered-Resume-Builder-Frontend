import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatSnackBarModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      age: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
      mobileNumber: ['+91', [Validators.required, Validators.pattern('^\\+91[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]],
      terms: [false, Validators.requiredTrue]
    });
  }

  get passwordInvalid(): boolean {
    const ctrl = this.registerForm.get('password');
    return !!(ctrl?.touched && ctrl?.invalid);
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const registerPayload = {
        fullName: this.registerForm.value.fullName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        username: this.registerForm.value.username,
        mobileNumber: this.registerForm.value.mobileNumber,
        age: this.registerForm.value.age
      };

      this.authService.register(registerPayload).subscribe({
        next: (res) => {
          this.isLoading = false;
          // Backend returns 200 with "message" field in all cases
          const msg = res?.message || '';
          if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
            this.errorMessage = msg;
          } else {
            this.snackBar.open('✅ Account created! Please Login.', 'Close', { duration: 5000 });
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          
          if (err.status === 0) {
            // Network error - backend not running
            this.errorMessage = '❌ Cannot reach server. Please ensure the backend is running.';
          } else if (err.error && typeof err.error === 'object') {
            // GlobalExceptionHandler returns Map<String, String> — e.g. {password: "...", mobileNumber: "..."}
            const messages = Object.values(err.error) as string[];
            this.errorMessage = messages.join(' | ');
          } else if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else {
            this.errorMessage = `Error ${err.status}: Registration failed. Please check all fields.`;
          }
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Please fill all fields correctly before submitting.';
    }
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }
}

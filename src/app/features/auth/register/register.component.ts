import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    fullName:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    age:          [null as number | null, [Validators.required, Validators.min(18), Validators.max(120)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\+91[0-9]{10}$/)]],
    email:        ['', [Validators.required, Validators.email]],
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
  step     = 1; // 1 = personal, 2 = credentials

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

  nextStep() {
    const controls = ['fullName', 'age', 'mobileNumber', 'email'];
    controls.forEach(c => this.form.get(c)!.markAsTouched());
    const valid = controls.every(c => this.form.get(c)!.valid);
    if (valid) this.step = 2;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';

    const payload = { ...this.form.value, age: Number(this.form.value.age) };
    this.auth.register(payload as any).subscribe({
      next: (res) => {
        this.success = res.message || 'Account created! Please sign in.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (e) => {
        this.error = e?.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  get fullName()     { return this.form.get('fullName')!; }
  get age()          { return this.form.get('age')!; }
  get mobileNumber() { return this.form.get('mobileNumber')!; }
  get email()        { return this.form.get('email')!; }
  get username()     { return this.form.get('username')!; }
  get password()     { return this.form.get('password')!; }
}

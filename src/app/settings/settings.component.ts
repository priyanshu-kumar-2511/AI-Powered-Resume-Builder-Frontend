import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ProfileRequest, PasswordChangeRequest } from '../auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab: 'profile' | 'security' | 'subscription' = 'profile';
  message: string = '';
  isError: boolean = false;

  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    age: [null, [Validators.min(0), Validators.max(120)]],
    mobileNumber: ['', [Validators.pattern('^[0-9+ ]*$')]]
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          fullName: profile.fullName,
          age: profile.age,
          mobileNumber: profile.mobileNumber
        });
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  onProfileUpdate(): void {
    if (this.profileForm.valid) {
      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: (res) => this.showMessage(res.message, false),
        error: (err) => this.showMessage(err.error.message || 'Update failed', true)
      });
    }
  }

  onPasswordChange(): void {
    if (this.passwordForm.valid) {
      const data: PasswordChangeRequest = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };
      this.authService.changePassword(data).subscribe({
        next: (res) => {
          this.showMessage(res.message, false);
          this.passwordForm.reset();
        },
        error: (err) => this.showMessage(err.error.message || 'Password change failed', true)
      });
    }
  }

  onDeactivate(): void {
    if (confirm('WARNING: Are you sure you want to deactivate your account? This action is reversible by contacting support, but you will lose immediate access.')) {
      this.authService.deactivateAccount().subscribe({
        next: () => {
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (err) => this.showMessage(err.error.message || 'Deactivation failed', true)
      });
    }
  }

  onBackToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private showMessage(msg: string, error: boolean): void {
    this.message = msg;
    this.isError = error;
    setTimeout(() => this.message = '', 5000);
  }
}

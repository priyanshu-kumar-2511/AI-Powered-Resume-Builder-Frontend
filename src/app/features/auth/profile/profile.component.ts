import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UserProfileResponse } from '../../../shared/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, NavbarComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private fb   = inject(FormBuilder);
  auth         = inject(AuthService);

  profile: UserProfileResponse | null = null;
  loading   = true;
  saving    = false;
  error     = '';
  success   = '';
  editMode  = false;

  isOAuthUser = false;

  form = this.fb.group({
    fullName:     ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: [''],
    age:          [null as number | null]
  });

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (u) => {
        this.profile = u;
        // Detect OAuth users: they have no password so mobileNumber is empty
        this.isOAuthUser = !u.mobileNumber || u.mobileNumber.trim() === '';
        this.fillForm(u);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load profile. Please refresh or log in again.';
        this.loading = false;
      }
    });
  }

  fillForm(u: UserProfileResponse) {
    this.form.patchValue({ fullName: u.fullName, mobileNumber: u.mobileNumber, age: u.age });
  }

  saveProfile() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = ''; this.success = '';

    this.auth.updateProfile(this.form.value as any).subscribe({
      next: (res) => {
        this.success = res.message || 'Profile updated successfully!';
        this.saving = false; this.editMode = false;
        this.auth.getProfile().subscribe(u => this.profile = u);
      },
      error: (e) => { this.error = e?.error?.message || 'Update failed.'; this.saving = false; }
    });
  }

  cancelEdit() { this.editMode = false; if (this.profile) this.fillForm(this.profile); }
  get initials(): string {
    return (this.profile?.fullName || this.profile?.username || 'U')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}

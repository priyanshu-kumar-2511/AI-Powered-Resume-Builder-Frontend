import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UserProfileResponse } from '../../../shared/models/models';
import { extractErrorMessage } from '../../../shared/utils/http-error.util';
import { PaymentService, SubscriptionStatusResponse } from '../../../core/services/payment.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, NavbarComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private fb   = inject(FormBuilder);
  auth         = inject(AuthService);
  private paymentSvc = inject(PaymentService);

  profile: UserProfileResponse | null = null;
  subscription: SubscriptionStatusResponse | null = null;
  loading   = true;
  saving    = false;
  subscriptionLoading = false;
  error     = '';
  success   = '';
  editMode  = false;

  isOAuthUser = false;

  form = this.fb.group({
    fullName:     ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: ['', [Validators.pattern(/^\+91[0-9]{10}$/)]],
    age:          [null as number | null, [Validators.min(18), Validators.max(120)]]
  });

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (u) => {
        this.profile = u;
        // Detect OAuth users: they have no password so mobileNumber is empty
        this.isOAuthUser = !u.mobileNumber || u.mobileNumber.trim() === '';
        this.fillForm(u);
        this.loading = false;
        this.fetchSubscription();
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
      error: (e) => { this.error = extractErrorMessage(e, 'Update failed.'); this.saving = false; }
    });
  }

  fetchSubscription() {
    this.subscriptionLoading = true;
    this.paymentSvc.getStatus().subscribe({
      next: (s) => {
        this.subscription = s;
        this.subscriptionLoading = false;
      },
      error: () => {
        this.subscriptionLoading = false;
        console.warn('Could not load subscription details.');
      }
    });
  }

  cancelSubscription() {
    if (!confirm('Are you sure you want to cancel Premium? Your Premium access will end immediately.')) return;
    
    this.paymentSvc.cancelSubscription().subscribe({
      next: (res) => {
        this.success = res.message;
        this.auth.refreshToken().subscribe({
          next: () => {
            this.auth.getProfile().subscribe({
              next: (u) => {
                this.profile = u;
                this.fetchSubscription();
              }
            });
          },
          error: () => {
            this.auth.getProfile().subscribe({
              next: (u) => {
                this.profile = u;
                this.fetchSubscription();
              }
            });
          }
        });
      },
      error: (e) => this.error = extractErrorMessage(e, 'Cancellation failed.')
    });
  }

  cancelEdit() { this.editMode = false; if (this.profile) this.fillForm(this.profile); }

  get canShowCancelSubscription(): boolean {
    if (this.profile?.subscriptionPlan !== 'PREMIUM') {
      return false;
    }

    return !this.subscription || this.subscription.status === 'ACTIVE';
  }

  get initials(): string {
    return (this.profile?.fullName || this.profile?.username || 'U')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}

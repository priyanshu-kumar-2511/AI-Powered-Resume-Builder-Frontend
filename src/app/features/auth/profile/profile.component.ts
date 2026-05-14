import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UserProfileResponse } from '../../../shared/models/models';
import { extractErrorMessage } from '../../../shared/utils/http-error.util';
import { PaymentService, SubscriptionStatusResponse } from '../../../core/services/payment.service';
import { ConfirmService } from '../../../shared/services/confirm.service';

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
  private confirmService = inject(ConfirmService);

  profile: UserProfileResponse | null = null;
  subscription: SubscriptionStatusResponse | null = null;
  loading   = true;
  saving    = false;
  subscriptionLoading = false;
  error     = '';
  success   = '';
  editMode  = false;

  private successTimeout: any;
  private errorTimeout: any;

  setSuccessMessage(msg: string): void {
    this.success = msg;
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    if (msg) {
      this.successTimeout = setTimeout(() => {
        this.success = '';
      }, 4000);
    }
  }

  setErrorMessage(msg: string): void {
    this.error = msg;
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    if (msg) {
      this.errorTimeout = setTimeout(() => {
        this.error = '';
      }, 4000);
    }
  }

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
        this.setErrorMessage('Failed to load profile. Please refresh or log in again.');
        this.loading = false;
      }
    });
  }

  fillForm(u: UserProfileResponse) {
    this.form.patchValue({ fullName: u.fullName, mobileNumber: u.mobileNumber, age: u.age });
  }

  saveProfile() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.setErrorMessage(''); this.setSuccessMessage('');

    this.auth.updateProfile(this.form.value as any).subscribe({
      next: (res) => {
        this.setSuccessMessage(res.message || 'Profile updated successfully!');
        this.saving = false; this.editMode = false;
        this.auth.getProfile().subscribe(u => this.profile = u);
      },
      error: (e) => { this.setErrorMessage(extractErrorMessage(e, 'Update failed.')); this.saving = false; }
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

  async cancelSubscription() {
    const confirmed = await this.confirmService.ask({
      title: 'Cancel Premium',
      message: 'Are you sure you want to cancel Premium? Your Premium access will end immediately.',
      confirmText: 'Yes, Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    
    this.paymentSvc.cancelSubscription().subscribe({
      next: (res) => {
        this.setSuccessMessage(res.message);
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
      error: (e) => this.setErrorMessage(extractErrorMessage(e, 'Cancellation failed.'))
    });
  }

  deletingAccount = false;

  async deleteAccount() {
    const confirmation = await this.confirmService.ask({
      title: 'Delete Account',
      message: '⚠️ WARNING: Are you sure you want to permanently delete your account? This action is irreversible and all your resumes, templates, and subscription benefits will be lost forever.',
      confirmText: 'Delete Permanently',
      type: 'danger'
    });
    if (!confirmation) return;

    this.deletingAccount = true;
    this.auth.deleteAccount().subscribe({
      next: async (res) => {
        this.deletingAccount = false;
        await this.confirmService.alert(
          'Account Deleted',
          'Your account has been deleted permanently. Redirecting to login...',
          'info'
        );
        this.auth.logout();
      },
      error: (e) => {
        this.deletingAccount = false;
        this.setErrorMessage(extractErrorMessage(e, 'Failed to delete account. Please try again.'));
      }
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

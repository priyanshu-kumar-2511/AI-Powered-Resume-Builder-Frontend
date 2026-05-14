import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, takeUntil, Subject } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ConfirmService, ConfirmOptions } from './shared/services/confirm.service';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmModalComponent, CommonModule],
  template: `
    <router-outlet />
    
    @if (confirmModal) {
      <app-confirm-modal
        [title]="confirmModal.options.title"
        [message]="confirmModal.options.message"
        [confirmText]="confirmModal.options.confirmText || 'Confirm'"
        [cancelText]="confirmModal.options.cancelText || 'Cancel'"
        [type]="confirmModal.options.type || 'info'"
        (confirm)="onConfirm(true)"
        (cancel)="onConfirm(false)"
      />
    }
  `
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private destroy$ = new Subject<void>();

  confirmModal: { options: ConfirmOptions, resolve: (val: boolean) => void } | null = null;

  ngOnInit(): void {
    this.confirmService.confirm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(modal => this.confirmModal = modal);
    const storedReturnUrl = sessionStorage.getItem('resumeai_return_url') || '/dashboard';
    const token = new URLSearchParams(window.location.search).get('token')
      || new URLSearchParams(window.location.search).get('accessToken');

    if (token) {
      localStorage.setItem('resumeai_token', token);
      sessionStorage.removeItem('resumeai_return_url');

      const target = window.location.pathname === '/login'
        ? (new URLSearchParams(window.location.search).get('returnUrl') || storedReturnUrl)
        : storedReturnUrl;

      this.auth.isLoggedIn.set(true);
      this.auth.getProfile().subscribe({
        next: () => this.router.navigateByUrl(target),
        error: () => this.router.navigateByUrl(target),
      });
      return;
    }

    if (this.auth.getToken() && !this.auth.currentUser()) {
      this.auth.getProfile().subscribe({
        error: () => {
          // Keep the app usable even if profile fetch fails; route guards/interceptors handle auth failures.
        }
      });
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        sessionStorage.setItem('resumeai_return_url', sessionStorage.getItem('resumeai_return_url') || '/dashboard');
      });
  }

  onConfirm(val: boolean): void {
    if (this.confirmModal) {
      this.confirmModal.resolve(val);
      this.confirmModal = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

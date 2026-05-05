import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
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
}

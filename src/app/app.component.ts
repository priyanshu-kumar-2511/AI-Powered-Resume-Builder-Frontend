import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private router = inject(Router);

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

      this.router.navigateByUrl(target);
      return;
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        sessionStorage.setItem('resumeai_return_url', sessionStorage.getItem('resumeai_return_url') || '/dashboard');
      });
  }
}

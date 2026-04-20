import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [],
  template: `
    <div class="processing-container">
      <div class="spinner"></div>
      <p>Finalizing your secure login...</p>
    </div>
  `,
  styles: [`
    .processing-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: var(--text-primary);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border-glass);
      border-top: 4px solid var(--accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    // Extract token from query params (returned by backend OAuth2 Success Handler)
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('auth_token', token);
        console.log('OAuth2 Login Successful, Token stored.');
        
        // Redirect to dashboard or home
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      } else {
        console.error('No token found in OAuth2 redirect');
        this.router.navigate(['/login']);
      }
    });
  }
}

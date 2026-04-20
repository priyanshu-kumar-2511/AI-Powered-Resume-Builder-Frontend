import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/**
 * Authentication Response Interface
 */
export interface AuthResponse {
  message: string;
  token?: string;
}

/**
 * AuthService handles all identity and access management communication between 
 * the Angular frontend and the Spring Boot Auth microservice.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  /**
   * Direct API endpoint for the Auth service.
   * During local development, we connect directly to port 8081 for stability.
   */
  private readonly AUTH_URL = 'http://localhost:8081/api/v1/auth';

  constructor() {}

  /**
   * Authenticates user with username and password.
   * Stores the JWT token in localStorage on success.
   */
  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
        }
      })
    );
  }

  /**
   * Registers a new user account with strict backend validation.
   */
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/register`, userData);
  }

  /**
   * Initiates the Google OAuth2 social login flow.
   * Redirects the browser to the Auth Service initiation endpoint.
   * The backend will automatically handle the redirect to Google.
   */
  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  }

  /**
   * Identity Recovery: Sends internal identity token/OTP for password reset.
   */
  initiatePasswordReset(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-password/initiate`, data);
  }

  /**
   * Finalizes password reset using the token/OTP received via email.
   */
  verifyPasswordReset(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-password/verify`, data);
  }

  /**
   * Identity Recovery: Initiates account recovery to retrieve a lost username.
   */
  initiateUsernameRecovery(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-username/initiate`, data);
  }

  /**
   * Finalizes username recovery.
   */
  verifyUsernameRecovery(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-username/verify`, data);
  }

  /**
   * Wipes the authentication state local to the browser.
   */
  logout(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Retrieves the current JWT token from storage.
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Checks if a user is currently authenticated by validating the JWT token format 
   * and checking its expiration timestamp.
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Decode JWT payload without signature verification (client-side only)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 > Date.now() : true;
    } catch {
      return false;
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  message: string;
  token?: string;
}

export interface ProfileRequest {
  fullName?: string;
  age?: number;
  mobileNumber?: string;
}

export interface PasswordChangeRequest {
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly AUTH_URL = environment.authApiUrl;

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
        }
      })
    );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/register`, userData);
  }

  loginWithGoogle(): void {
    // Use environment config so the URL is consistent with the rest of the app.
    // Previously this was hardcoded to http://localhost:8080; now it reads
    // from environment.oauth2BaseUrl so it works in both dev and prod.
    window.location.href = `${environment.oauth2BaseUrl}/oauth2/authorization/google`;
  }

  loginWithLinkedIn(): void {
    // Same pattern for LinkedIn OAuth2 flow.
    window.location.href = `${environment.oauth2BaseUrl}/oauth2/authorization/linkedin`;
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.AUTH_URL}/profile`);
  }

  // --- Identity Recovery ---

  initiatePasswordReset(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-password/initiate`, data);
  }

  verifyPasswordReset(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-password/verify`, data);
  }

  initiateUsernameRecovery(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-username/initiate`, data);
  }

  verifyUsernameRecovery(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/forgot-username/verify`, data);
  }

  // --- User Operations ---

  updateProfile(data: ProfileRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.AUTH_URL}/profile`, data);
  }

  changePassword(data: PasswordChangeRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.AUTH_URL}/password`, data);
  }

  updateSubscription(plan: 'FREE' | 'PREMIUM'): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.AUTH_URL}/subscription?plan=${plan}`, {});
  }

  deactivateAccount(): Observable<AuthResponse> {
    return this.http.delete<AuthResponse>(`${this.AUTH_URL}/deactivate`);
  }

  // --- Admin Operations ---

  adminGetAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.gatewayUrl}/api/v1/admin/users`);
  }

  adminUpdateStatus(username: string, active: boolean): Observable<any> {
    return this.http.put<any>(`${environment.gatewayUrl}/api/v1/admin/users/${username}/status?active=${active}`, {});
  }

  // --- Auth State Helpers ---

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload.roles || [];
      return roles.includes('ROLE_ADMIN');
    } catch {
      return false;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 > Date.now() : true;
    } catch {
      return false;
    }
  }
}
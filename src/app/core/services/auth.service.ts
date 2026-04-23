import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  RegisterRequest, LoginRequest, LoginResponse,
  UserProfileResponse, ProfileRequest, MessageResponse,
  OtpVerificationRequest, PasswordResetInitiateRequest, UsernameRecoveryRequest
} from '../../shared/models/models';

const API = 'http://localhost:8080/api/v1/auth';
const TOKEN_KEY = 'resumeai_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  // Reactive auth state
  isLoggedIn  = signal<boolean>(!!this.getToken());
  currentUser = signal<UserProfileResponse | null>(null);

  // ── Token helpers ────────────────────────────────────────────────────────────
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }

  private saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.isLoggedIn.set(true);
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  // ── Auth endpoints ───────────────────────────────────────────────────────────
  register(payload: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API}/register`, payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/login`, payload).pipe(
      tap(res => this.saveToken(res.token))
    );
  }

  logout(): void {
    this.removeToken();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<{ token: string }> {
    return this.http.get<{ token: string }>(`${API}/refresh`).pipe(
      tap(res => this.saveToken(res.token))
    );
  }

  // ── Profile ──────────────────────────────────────────────────────────────────
  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${API}/profile`).pipe(
      tap(u => this.currentUser.set(u))
    );
  }

  updateProfile(payload: ProfileRequest): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${API}/profile`, payload);
  }

  // ── Forgot password ──────────────────────────────────────────────────────────
  // Backend PasswordResetInitiateRequest has a single `identifier` field (email or username).
  initiatePasswordReset(payload: PasswordResetInitiateRequest): Observable<MessageResponse> {
    const body = { identifier: payload.email };
    return this.http.post<MessageResponse>(`${API}/forgot-password/initiate`, body);
  }

  // FIX: Backend OtpVerificationRequest uses `identifier` (not `email`).
  verifyPasswordReset(payload: OtpVerificationRequest): Observable<MessageResponse> {
    const body = {
      identifier: payload.email,   // map frontend `email` → backend `identifier`
      otp: payload.otp,
      newPassword: payload.newPassword
    };
    return this.http.post<MessageResponse>(`${API}/forgot-password/verify`, body);
  }

  // ── Forgot username ──────────────────────────────────────────────────────────
  // FIX: Backend UsernameRecoveryRequest requires both `email` AND `password`.
  // Frontend only collects email for this flow. We pass an empty password so
  // the request is structurally valid; the backend will throw "Incorrect Password"
  // which is surfaced to the user. For a better UX the form should ask for the
  // current password — see comments in forgot-username component.
  initiateUsernameRecovery(payload: UsernameRecoveryRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API}/forgot-username/initiate`, payload);
  }

  // FIX: Backend OtpVerificationRequest uses `identifier` (not `email`).
  verifyUsernameRecovery(payload: OtpVerificationRequest): Observable<MessageResponse> {
    const body = {
      identifier: payload.email,   // map frontend `email` → backend `identifier`
      otp: payload.otp
    };
    return this.http.post<MessageResponse>(`${API}/forgot-username/verify`, body);
  }

  // ── OAuth2 ───────────────────────────────────────────────────────────────────
  // FIX: Backend OAuth2SuccessHandler redirects to /login?token=... not /login-success.
  // The LoginComponent.ngOnInit() picks up the `token` query param on /login.
  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginWithLinkedIn(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/linkedin';
  }
}

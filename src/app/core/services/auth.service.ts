import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  UserProfileResponse,
  ProfileRequest,
  MessageResponse,
  OtpVerificationRequest,
  PasswordResetInitiateRequest,
  UsernameRecoveryRequest,
} from '../../shared/models/models';
import { AUTH_API, GATEWAY_ORIGIN } from '../config/api.config';

const TOKEN_KEY = 'resumeai_token';

/**
 * Service responsible for managing user authentication state, tokens,
 * and communicating with the backend authentication endpoints.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Reactive auth state
  isLoggedIn = signal<boolean>(!!this.getToken());
  currentUser = signal<UserProfileResponse | null>(null);

  // ── Token helpers ────────────────────────────────────────────────────────────
  
  /**
   * Retrieves the JWT token from local storage.
   * @returns The JWT token string, or null if not found.
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.isLoggedIn.set(true);
  }

  /**
   * Removes the JWT token from local storage and updates the reactive auth state.
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  /**
   * Called after a successful Razorpay payment verification.
   * Replaces the stored JWT with the new one (which contains PREMIUM plan claim)
   * and updates the currentUser signal reactively so all plan-gated UI responds instantly.
   */
  refreshTokenFromPayment(newToken?: string | null): Observable<UserProfileResponse | null> {
    const syncProfile$ = this.getProfile().pipe(
      catchError(() => of(this.currentUser()))
    );

    this.applyOptimisticPremiumState();

    if (this.isUsableJwtToken(newToken)) {
      this.saveToken(newToken);
      return syncProfile$;
    }

    return this.refreshToken().pipe(
      switchMap(() => syncProfile$),
      catchError(() => of(this.currentUser()))
    );
  }

  /**
   * Determines the user's current subscription plan by checking the profile
   * first, and falling back to JWT claims if the profile is not loaded.
   * @returns 'FREE' or 'PREMIUM'
   */
  getCurrentPlan(): 'FREE' | 'PREMIUM' {
    const fromProfile = this.currentUser()?.subscriptionPlan;
    if (fromProfile) {
      return fromProfile;
    }

    const tokenClaims = this.getTokenClaims();
    const tokenPlan =
      this.getStringClaim(tokenClaims, 'subscriptionPlan') ??
      this.getStringClaim(tokenClaims, 'plan');

    return tokenPlan === 'PREMIUM' ? 'PREMIUM' : 'FREE';
  }

  getCurrentUserId(): number | null {
    const profileUserId = this.currentUser()?.userId;
    if (typeof profileUserId === 'number' && Number.isFinite(profileUserId)) {
      return profileUserId;
    }

    const tokenClaims = this.getTokenClaims();
    const tokenUserId =
      this.getNumericClaim(tokenClaims, 'userId') ??
      this.getNumericClaim(tokenClaims, 'user_id') ??
      this.getNumericClaim(tokenClaims, 'id');

    if (tokenUserId !== null) {
      return tokenUserId;
    }

    return null;
  }

  // ── Auth endpoints ───────────────────────────────────────────────────────────
  
  /**
   * Initiates user registration (Step 1).
   * Sends user details to backend to trigger an OTP email.
   */
  initiateRegistration(payload: { fullName: string; age: number; mobileNumber: string; email: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${AUTH_API}/register/initiate`, payload);
  }

  /**
   * Verifies the registration OTP (Step 2).
   */
  verifyRegistrationOtp(email: string, otp: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${AUTH_API}/register/verify-otp`, { identifier: email, otp });
  }

  /**
   * Registers a new user with the backend (Step 3).
   * @param payload The user registration details.
   * @returns An observable emitting the backend's message response.
   */
  register(payload: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${AUTH_API}/register`, payload);
  }

  /**
   * Authenticates a user and persists the JWT token in local storage.
   * Updates the global isLoggedIn reactive signal.
   */
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${AUTH_API}/login`, payload)
      .pipe(tap((res) => this.saveToken(res.token)));
  }

  /**
   * Logs the user out by removing the token and redirecting to the login page.
   */
  logout(): void {
    this.removeToken();
    this.router.navigate(['/login']);
  }

  /**
   * Refreshes the JWT token by calling the backend refresh endpoint.
   * On success, the new token is automatically saved.
   * @returns An observable emitting the new token response.
   */
  refreshToken(): Observable<{ token: string }> {
    return this.http
      .get<{ token: string }>(`${AUTH_API}/refresh`)
      .pipe(tap((res) => this.saveToken(res.token)));
  }

  // ── Profile ──────────────────────────────────────────────────────────────────
  
  /**
   * Fetches the full profile of the authenticated user.
   * If claims (roles/plan) in the token differ from the profile, it triggers an auto-refresh.
   */
  getProfile(): Observable<UserProfileResponse> {
    return this.http
      .get<UserProfileResponse>(`${AUTH_API}/profile`)
      .pipe(tap((u) => {
        this.currentUser.set(u);
        this.refreshTokenIfClaimsMismatch(u);
      }));
  }

  /**
   * Updates the user's profile details (fullName, age, mobileNumber).
   * @param payload The profile update data.
   * @returns An observable emitting the backend success message.
   */
  updateProfile(payload: ProfileRequest): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${AUTH_API}/profile`, payload);
  }

  /**
   * Permanently deletes the currently logged-in user's account.
   */
  deleteAccount(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${AUTH_API}/profile`);
  }

  // ── Forgot password ──────────────────────────────────────────────────────────
  /**
   * Initiates the password reset flow.
   * Backend PasswordResetInitiateRequest has a single `identifier` field (email or username).
   * @param payload The request containing the user's email.
   * @returns An observable emitting the backend message.
   */
  initiatePasswordReset(
    payload: PasswordResetInitiateRequest,
  ): Observable<MessageResponse> {
    const body = { identifier: payload.email };
    return this.http.post<MessageResponse>(
      `${AUTH_API}/forgot-password/initiate`,
      body,
    );
  }

  /**
   * Completes the password reset flow using the received OTP.
   * FIX: Backend OtpVerificationRequest uses `identifier` (not `email`).
   * @param payload The request containing the email, OTP, and new password.
   * @returns An observable emitting the backend message.
   */
  verifyPasswordReset(
    payload: OtpVerificationRequest,
  ): Observable<MessageResponse> {
    const body = {
      identifier: payload.email, // map frontend `email` → backend `identifier`
      otp: payload.otp,
      newPassword: payload.newPassword,
    };
    return this.http.post<MessageResponse>(
      `${AUTH_API}/forgot-password/verify`,
      body,
    );
  }

  // ── Forgot username ──────────────────────────────────────────────────────────
  /**
   * Initiates the username recovery flow.
   * FIX: Backend UsernameRecoveryRequest requires both `email` AND `password`.
   * Frontend only collects email for this flow. We pass an empty password so
   * the request is structurally valid; the backend will throw "Incorrect Password"
   * which is surfaced to the user. For a better UX the form should ask for the
   * current password — see comments in forgot-username component.
   * @param payload The recovery request containing the email.
   * @returns An observable emitting the backend message.
   */
  initiateUsernameRecovery(
    payload: UsernameRecoveryRequest,
  ): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${AUTH_API}/forgot-username/initiate`,
      payload,
    );
  }

  /**
   * Completes the username recovery flow. On success, the backend emails the username.
   * FIX: Backend OtpVerificationRequest uses `identifier` (not `email`).
   * @param payload The verification request containing the email and OTP.
   * @returns An observable emitting the backend message.
   */
  verifyUsernameRecovery(
    payload: OtpVerificationRequest,
  ): Observable<MessageResponse> {
    const body = {
      identifier: payload.email, // map frontend `email` → backend `identifier`
      otp: payload.otp,
    };
    return this.http.post<MessageResponse>(
      `${AUTH_API}/forgot-username/verify`,
      body,
    );
  }

  // ── OAuth2 (Social Login) ────────────────────────────────────────────────────
  /**
   * Redirects user to Google's consent screen.
   * Token is received via URL query parameter upon redirect back to /login.
   */
  loginWithGoogle(): void {
    const oauthOrigin = GATEWAY_ORIGIN || window.location.origin;
    window.location.href = `${oauthOrigin}/oauth2/authorization/google`;
  }

  /**
   * Initiates LinkedIn OAuth2 login flow by redirecting the browser to the backend OAuth endpoint.
   */
  loginWithLinkedIn(): void {
    const oauthOrigin = GATEWAY_ORIGIN || window.location.origin;
    window.location.href = `${oauthOrigin}/oauth2/authorization/linkedin`;
  }

  private getTokenClaims(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const segments = token.split('.');
    if (segments.length < 2) {
      return null;
    }

    try {
      const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(
        Math.ceil(normalized.length / 4) * 4,
        '=',
      );
      const decodedBytes = atob(padded);
      const decodedStr = decodeURIComponent(
        decodedBytes
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(decodedStr) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getNumericClaim(
    claims: Record<string, unknown> | null,
    key: string,
  ): number | null {
    const value = claims?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private getStringClaim(
    claims: Record<string, unknown> | null,
    key: string,
  ): string | null {
    const value = claims?.[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private applyOptimisticPremiumState(): void {
    this.isLoggedIn.set(true);
    const user = this.currentUser();
    if (user) {
      this.currentUser.set({ ...user, subscriptionPlan: 'PREMIUM' as const });
    }
  }

  private isUsableJwtToken(token: string | null | undefined): token is string {
    return typeof token === 'string'
      && token.trim().length > 0
      && token !== 'undefined'
      && token !== 'null'
      && token.split('.').length === 3;
  }

  /**
   * Checks if the currently authenticated user has administrative privileges.
   * Evaluates the profile state first, then falls back to decoding JWT claims.
   * @returns True if the user is an admin, false otherwise.
   */
  isAdmin(): boolean {
    // Check profile signal first
    const user = this.currentUser();
    if (user?.roles?.some((r) => r === 'ROLE_ADMIN' || r === 'ADMIN'))
      return true;

    // Fallback: decode JWT
    const claims = this.getTokenClaims();
    const roles = claims?.['roles'] ?? claims?.['role'];
    const rolesArr: string[] = Array.isArray(roles)
      ? roles
      : roles
        ? [roles as string]
        : [];
    return rolesArr.some((r) => r === 'ROLE_ADMIN' || r === 'ADMIN');
  }

  /** Returns the subscription plan as a signal-compatible string */
  subscriptionPlan(): 'FREE' | 'PREMIUM' {
    return this.getCurrentPlan();
  }

  private refreshTokenIfClaimsMismatch(profile: UserProfileResponse): void {
    const claims = this.getTokenClaims();
    if (!claims) {
      return;
    }

    const tokenRolesRaw = claims['roles'] ?? claims['role'];
    const tokenRoles = Array.isArray(tokenRolesRaw)
      ? tokenRolesRaw.map((role) => String(role))
      : tokenRolesRaw
        ? [String(tokenRolesRaw)]
        : [];

    const profileRoles = (profile.roles ?? []).map((role) => String(role));
    const tokenUserId = this.getNumericClaim(claims, 'userId')
      ?? this.getNumericClaim(claims, 'user_id')
      ?? this.getNumericClaim(claims, 'id');
    const tokenPlan = this.getStringClaim(claims, 'subscriptionPlan')
      ?? this.getStringClaim(claims, 'plan');

    const sameRoles =
      profileRoles.length === tokenRoles.length &&
      profileRoles.every((role) => tokenRoles.includes(role));
    const sameUserId = tokenUserId === profile.userId;
    const samePlan = !profile.subscriptionPlan || tokenPlan === profile.subscriptionPlan;

    if (sameRoles && sameUserId && samePlan) {
      return;
    }

    this.refreshToken().subscribe({
      error: () => {
        // Leave the current token in place; the caller will surface any auth failures.
      }
    });
  }
}

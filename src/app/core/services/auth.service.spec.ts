import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AUTH_API } from '../config/api.config';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true))
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle login and save token', () => {
    const mockRes = { token: 'part1.eyJzdWJzY3JpcHRpb25QbGFuIjoiRlJFRSIsInVzZXJJZCI6MX0.part3' };
    service.login({ username: 'u', password: 'p' }).subscribe();
    
    const req = httpMock.expectOne(`${AUTH_API}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);

    expect(service.getToken()).toBe(mockRes.token);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentUserId()).toBe(1);
    expect(service.getCurrentPlan()).toBe('FREE');
  });

  it('should handle logout', () => {
    localStorage.setItem('resumeai_token', 'test');
    service.logout();
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should fetch profile and set currentUser', () => {
    const mockProfile = { userId: 1, fullName: 'Test', subscriptionPlan: 'PREMIUM', roles: ['ADMIN'] };
    service.getProfile().subscribe();
    
    const req = httpMock.expectOne(request => request.url.startsWith(`${AUTH_API}/profile`));
    req.flush(mockProfile);

    expect(service.currentUser()).toEqual(mockProfile as any);
    expect(service.isAdmin()).toBe(true);
    expect(service.getCurrentPlan()).toBe('PREMIUM');
  });

  it('should handle token decoding for claims', () => {
    // base64url encoded: {"subscriptionPlan":"PREMIUM","userId":123,"roles":["ADMIN"]}
    const claims = btoa(JSON.stringify({ subscriptionPlan: 'PREMIUM', userId: 123, roles: ['ADMIN'] }));
    const token = `a.${claims}.c`;
    localStorage.setItem('resumeai_token', token);

    expect(service.getCurrentUserId()).toBe(123);
    expect(service.getCurrentPlan()).toBe('PREMIUM');
    expect(service.isAdmin()).toBe(true);
  });

  it('should initiate registration', () => {
    service.initiateRegistration({ fullName: 'N', age: 20, mobileNumber: '1', email: 'e' }).subscribe(res => {
      expect(res.message).toBe('Success');
    });
    const req = httpMock.expectOne(`${AUTH_API}/register/initiate`);
    req.flush({ message: 'Success' });
  });

  it('should verify OTP', () => {
    service.verifyRegistrationOtp('e', '1234').subscribe(res => {
      expect(res.message).toBe('Success');
    });
    const req = httpMock.expectOne(`${AUTH_API}/register/verify-otp`);
    req.flush({ message: 'Success' });
  });

  it('should refresh token after payment', () => {
    const newToken = 'a.b.c';
    service.refreshTokenFromPayment(newToken).subscribe(res => {
      expect(res?.subscriptionPlan).toBe('PREMIUM');
    });
    
    // Should call getProfile
    const req = httpMock.expectOne(request => request.url.startsWith(`${AUTH_API}/profile`));
    req.flush({ subscriptionPlan: 'PREMIUM' });
    
    expect(service.getToken()).toBe(newToken);
  });

  it('should handle password reset initiation', () => {
    service.initiatePasswordReset({ email: 'test@example.com' }).subscribe(res => {
      expect(res.message).toBe('Sent');
    });
    const req = httpMock.expectOne(`${AUTH_API}/forgot-password/initiate`);
    expect(req.request.body.identifier).toBe('test@example.com');
    req.flush({ message: 'Sent' });
  });

  it('should handle password reset verification', () => {
    service.verifyPasswordReset({ email: 'e', otp: '1', newPassword: 'p' } as any).subscribe(res => {
      expect(res.message).toBe('Success');
    });
    const req = httpMock.expectOne(`${AUTH_API}/forgot-password/verify`);
    req.flush({ message: 'Success' });
  });

  it('should handle username recovery initiation', () => {
    service.initiateUsernameRecovery({ email: 'e' } as any).subscribe(res => {
      expect(res.message).toBe('Success');
    });
    const req = httpMock.expectOne(`${AUTH_API}/forgot-username/initiate`);
    req.flush({ message: 'Success' });
  });

  it('should handle account deletion', () => {
    service.deleteAccount().subscribe();
    const req = httpMock.expectOne(`${AUTH_API}/profile`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Deleted' });
  });

  it('should refresh token via endpoint', () => {
    service.refreshToken().subscribe();
    const req = httpMock.expectOne(`${AUTH_API}/refresh`);
    req.flush({ token: 'new.token.str' });
    expect(service.getToken()).toBe('new.token.str');
  });

  it('should handle updateProfile', () => {
    service.updateProfile({ fullName: 'New Name' } as any).subscribe();
    const req = httpMock.expectOne(`${AUTH_API}/profile`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Updated' });
  });

  it('should return null for malformed token', () => {
    localStorage.setItem('resumeai_token', 'bad-token');
    expect(service.getCurrentUserId()).toBeNull();
    expect(service.getCurrentPlan()).toBe('FREE');
    expect(service.isAdmin()).toBeFalse();
  });

  it('should update isLoggedIn signal on login and logout', () => {
    // isLoggedIn is a reactive signal — reset it to false first, then verify transitions.
    service.logout(); // ensure signal starts false and no pending http calls
    expect(service.isLoggedIn()).toBeFalse();

    // After login the signal becomes true
    service.login({ username: 'u', password: 'p' }).subscribe();
    const req = httpMock.expectOne(`${AUTH_API}/login`);
    req.flush({ token: 'a.b.c' });
    expect(service.isLoggedIn()).toBeTrue();

    // After logout the signal becomes false
    service.logout();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should refresh token if claims mismatch', () => {
    const claims = btoa(JSON.stringify({ subscriptionPlan: 'FREE', roles: ['USER'] }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);

    // Profile has PREMIUM -> Mismatch
    const mockProfile = { subscriptionPlan: 'PREMIUM', roles: ['USER'] } as any;
    
    // Using bypass to hit the private method
    (service as any).refreshTokenIfClaimsMismatch(mockProfile);

    const req = httpMock.expectOne(`${AUTH_API}/refresh`);
    req.flush({ token: 'new-token' });
    expect(service.getToken()).toBe('new-token');
  });

  it('should not refresh token if claims match', () => {
    // Must include userId so sameUserId check (tokenUserId === profile.userId) passes
    const claims = btoa(JSON.stringify({ subscriptionPlan: 'FREE', roles: ['USER'], userId: 42 }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);

    // Profile matches token exactly
    const mockProfile = { subscriptionPlan: 'FREE', roles: ['USER'], userId: 42 } as any;
    
    (service as any).refreshTokenIfClaimsMismatch(mockProfile);

    httpMock.expectNone(`${AUTH_API}/refresh`);
  });

  it('should handle refreshTokenFromPayment with null token', () => {
    service.refreshTokenFromPayment(null).subscribe();
    
    // Should call refreshToken() endpoint then getProfile()
    const refreshReq = httpMock.expectOne(`${AUTH_API}/refresh`);
    refreshReq.flush({ token: 'refreshed.token.str' });
    
    const profileReq = httpMock.expectOne(request => request.url.startsWith(`${AUTH_API}/profile`));
    profileReq.flush({ userId: 1 });
  });

  it('should fallback to currentUser if getProfile fails in refreshTokenFromPayment', () => {
    service.currentUser.set({ userId: 99, subscriptionPlan: 'FREE' } as any);
    service.refreshTokenFromPayment('a.b.c').subscribe(res => {
      expect(res?.userId).toBe(99);
    });
    
    const req = httpMock.expectOne(request => request.url.startsWith(`${AUTH_API}/profile`));
    req.error(new ErrorEvent('Network error'));
  });

  it('should resolve tokenPlan from "plan" claim if "subscriptionPlan" is missing', () => {
    const claims = btoa(JSON.stringify({ plan: 'PREMIUM' }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    expect(service.getCurrentPlan()).toBe('PREMIUM');
  });

  it('should resolve tokenUserId from "user_id" or "id" claims', () => {
    // Test user_id
    let claims = btoa(JSON.stringify({ user_id: 111 }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    expect(service.getCurrentUserId()).toBe(111);

    // Test id
    claims = btoa(JSON.stringify({ id: 222 }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    expect(service.getCurrentUserId()).toBe(222);
  });

  it('should parse numeric claim from string', () => {
    const claims = btoa(JSON.stringify({ userId: "555" }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    expect(service.getCurrentUserId()).toBe(555);
  });

  it('should handle invalid numeric claim type', () => {
    const claims = btoa(JSON.stringify({ userId: { object: true } }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    expect(service.getCurrentUserId()).toBeNull();
  });

  it('should handle isAdmin with single string role claim', () => {
    const claims = btoa(JSON.stringify({ role: 'ADMIN' }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    expect(service.isAdmin()).toBeTrue();
  });

  it('should handle refreshTokenIfClaimsMismatch error gracefully', () => {
    const claims = btoa(JSON.stringify({ subscriptionPlan: 'FREE', userId: 1 }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    
    // Mismatch plan
    (service as any).refreshTokenIfClaimsMismatch({ userId: 1, subscriptionPlan: 'PREMIUM' });
    
    const req = httpMock.expectOne(`${AUTH_API}/refresh`);
    req.error(new ErrorEvent('Unauthorized'));
    // Should not throw
  });

  it('should trigger refresh if userId mismatches', () => {
    const claims = btoa(JSON.stringify({ userId: 1 }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    (service as any).refreshTokenIfClaimsMismatch({ userId: 2 });
    httpMock.expectOne(`${AUTH_API}/refresh`);
  });

  it('should trigger refresh if roles length mismatches', () => {
    const claims = btoa(JSON.stringify({ roles: ['USER'] }));
    localStorage.setItem('resumeai_token', `a.${claims}.c`);
    (service as any).refreshTokenIfClaimsMismatch({ roles: ['USER', 'ADMIN'] });
    httpMock.expectOne(`${AUTH_API}/refresh`);
  });

  it('should return null for getTokenClaims if token missing or invalid', () => {
    localStorage.removeItem('resumeai_token');
    expect((service as any).getTokenClaims()).toBeNull();

    localStorage.setItem('resumeai_token', 'one_segment');
    expect((service as any).getTokenClaims()).toBeNull();
  });

  it('should handle getTokenClaims catch block', () => {
    localStorage.setItem('resumeai_token', 'a.!!!invalid_base64!!!.c');
    expect((service as any).getTokenClaims()).toBeNull();
  });

  it('should use getStringClaim fallback to null for empty or non-string', () => {
    const claims = { key: '  ' };
    expect((service as any).getStringClaim(claims, 'key')).toBeNull();
    expect((service as any).getStringClaim(claims, 'missing')).toBeNull();
  });

  it('should return correct subscriptionPlan from signal helper', () => {
    service.currentUser.set({ subscriptionPlan: 'PREMIUM' } as any);
    expect(service.subscriptionPlan()).toBe('PREMIUM');
  });

  it('should ignore mismatch if claims are null', () => {
    localStorage.removeItem('resumeai_token');
    (service as any).refreshTokenIfClaimsMismatch({ userId: 1 });
    httpMock.expectNone(`${AUTH_API}/refresh`);
  });
});


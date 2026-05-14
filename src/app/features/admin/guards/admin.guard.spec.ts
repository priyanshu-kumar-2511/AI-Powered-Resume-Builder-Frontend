import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../../../core/services/auth.service';
import { of } from 'rxjs';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'currentUser', 'getToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should return false and navigate to login if not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return true if user has admin role in profile', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.currentUser.and.returnValue({ roles: ['ROLE_ADMIN'] } as any);
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe(true);
  });

  it('should return true if user has admin role in JWT token', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.currentUser.and.returnValue({ roles: ['ROLE_USER'] } as any);
    // JWT payload: {"roles":["ADMIN"]}
    const payload = btoa(JSON.stringify({ roles: ['ADMIN'] }));
    authServiceSpy.getToken.and.returnValue(`a.${payload}.c`);
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe(true);
  });

  it('should return false and navigate to dashboard if no admin role', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.currentUser.and.returnValue({ roles: ['ROLE_USER'] } as any);
    authServiceSpy.getToken.and.returnValue(null);
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle malformed token gracefully', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.currentUser.and.returnValue({ roles: ['ROLE_USER'] } as any);
    authServiceSpy.getToken.and.returnValue('malformed.token.here');
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});

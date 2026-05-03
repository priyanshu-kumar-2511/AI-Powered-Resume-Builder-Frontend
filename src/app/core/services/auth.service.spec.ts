import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { AUTH_API } from '../config/api.config';
import { LoginRequest, LoginResponse, UserProfileResponse } from '../../shared/models/models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.removeItem('resumeai_token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token management', () => {
    it('should save token and set isLoggedIn to true on login', () => {
      const mockLoginRequest: LoginRequest = { username: 'testuser', password: 'password123' };
      const mockLoginResponse: LoginResponse = { token: 'mock-jwt-token', message: 'Success' };

      service.login(mockLoginRequest).subscribe(response => {
        expect(response.token).toEqual('mock-jwt-token');
      });

      const req = httpMock.expectOne(`${AUTH_API}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);

      expect(localStorage.getItem('resumeai_token')).toEqual('mock-jwt-token');
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should remove token on logout', () => {
      localStorage.setItem('resumeai_token', 'mock-token');
      service.isLoggedIn.set(true);

      service.logout();

      expect(localStorage.getItem('resumeai_token')).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('User Profile', () => {
    it('should fetch and set current user profile', () => {
      const mockProfile: UserProfileResponse = {
        userId: 1,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        mobileNumber: '1234567890',
        age: 30,
        subscriptionPlan: 'FREE',
        roles: ['ROLE_USER'],
        isActive: true
      };

      service.getProfile().subscribe(profile => {
        expect(profile.username).toEqual('testuser');
      });

      const req = httpMock.expectOne(`${AUTH_API}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);

      expect(service.currentUser()).toEqual(mockProfile);
    });
  });

  describe('Plan and Role checking', () => {
    it('should determine PREMIUM plan from profile', () => {
      service.currentUser.set({ subscriptionPlan: 'PREMIUM' } as UserProfileResponse);
      expect(service.getCurrentPlan()).toEqual('PREMIUM');
    });

    it('should determine FREE plan from profile', () => {
      service.currentUser.set({ subscriptionPlan: 'FREE' } as UserProfileResponse);
      expect(service.getCurrentPlan()).toEqual('FREE');
    });

    it('should identify admin role from profile', () => {
      service.currentUser.set({ roles: ['ROLE_USER', 'ROLE_ADMIN'] } as UserProfileResponse);
      expect(service.isAdmin()).toBeTrue();
    });

    it('should identify non-admin role from profile', () => {
      service.currentUser.set({ roles: ['ROLE_USER'] } as UserProfileResponse);
      expect(service.isAdmin()).toBeFalse();
    });
  });
});

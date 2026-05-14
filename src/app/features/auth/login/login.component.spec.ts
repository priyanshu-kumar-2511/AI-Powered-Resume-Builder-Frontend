import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jasmine.createSpy('login').and.returnValue(of({})),
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({})),
      loginWithGoogle: jasmine.createSpy('loginWithGoogle'),
      loginWithLinkedIn: jasmine.createSpy('loginWithLinkedIn'),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      isLoggedIn: { set: jasmine.createSpy('set') }
    };

    mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      },
      queryParams: of({}),
      params: of({}),
      url: of([]),
      data: of({}),
      fragment: of('')
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should have a valid form when filled', () => {
    component.form.patchValue({
      username: 'testuser',
      password: 'password123'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should not submit if form is invalid', () => {
    component.submit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should call login and redirect on success', () => {
    component.form.patchValue({ username: 'testuser', password: 'password123' });
    component.submit();

    expect(component.loading).toBeTrue();
    expect(mockAuthService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
    expect(mockAuthService.getProfile).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard'); // default returnUrl
  });

  it('should redirect to admin if user is admin', () => {
    mockAuthService.isAdmin.and.returnValue(true);
    component.form.patchValue({ username: 'admin', password: 'password123' });
    component.submit();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('should handle login error correctly', () => {
    mockAuthService.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    
    component.form.patchValue({ username: 'testuser', password: 'wrong' });
    component.submit();

    expect(component.loading).toBeFalse();
    expect(component.error).toEqual('Invalid credentials');
  });

  it('should handle ACCOUNT_SUSPENDED error', () => {
    mockAuthService.login.and.returnValue(throwError(() => ({ error: { message: 'ACCOUNT_SUSPENDED' } })));
    
    component.form.patchValue({ username: 'testuser', password: 'wrong' });
    component.submit();

    expect(component.loading).toBeFalse();
    expect(component.isSuspended).toBeTrue();
  });

  it('should initiate Google login', () => {
    component.googleLogin();
    expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
  });

  it('should initiate LinkedIn login', () => {
    component.linkedinLogin();
    expect(mockAuthService.loginWithLinkedIn).toHaveBeenCalled();
  });
});

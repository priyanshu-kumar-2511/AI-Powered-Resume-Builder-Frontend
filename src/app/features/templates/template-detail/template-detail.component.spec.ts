import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateDetailComponent } from './template-detail.component';
import { RouterTestingModule } from '@angular/router/testing';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { NotificationPollingService } from '../../notifications/services/notification-polling.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('TemplateDetailComponent', () => {
  let component: TemplateDetailComponent;
  let fixture: ComponentFixture<TemplateDetailComponent>;
  let mockTemplateService: any;
  let mockAuthService: any;
  let mockResumeApi: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockTemplateService = {
      getTemplateById: jasmine.createSpy('getTemplateById').and.returnValue(of({ templateId: 1, name: 'T1', tier: 'FREE', category: 'PROFESSIONAL' })),
      incrementUsage: jasmine.createSpy('incrementUsage').and.returnValue(of({}))
    };

    mockAuthService = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue('FREE'),
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ userId: 5 })),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(5),
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ fullName: 'John' }),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
    };

    mockResumeApi = {
      create: jasmine.createSpy('create').and.returnValue(of({ resumeId: 100 }))
    };

    const mockTemplateRenderer = {
      renderDocument: jasmine.createSpy('renderDocument').and.returnValue('<html></html>')
    };

    await TestBed.configureTestingModule({
      imports: [TemplateDetailComponent, RouterTestingModule],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ResumeApiService, useValue: mockResumeApi },
        { provide: TemplateRenderService, useValue: mockTemplateRenderer },
        { provide: NotificationPollingService, useValue: { startPolling: jasmine.createSpy(), stopPolling: jasmine.createSpy(), unreadCount$: of(0) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateDetailComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
  });

  it('should load template details on init', () => {
    expect(mockTemplateService.getTemplateById).toHaveBeenCalledWith(1);
    expect(component.template?.templateId).toBe(1);
    expect(component.previewSrcdoc).toBe('<html></html>');
  });

  it('should handle template load error', () => {
    mockTemplateService.getTemplateById.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    expect(component.error).toBe('Template not found.');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to register if not logged in on useTemplate', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    component.useTemplate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should show premium modal if premium template chosen on free plan', () => {
    component.template = { tier: 'PREMIUM' } as any;
    component.useTemplate();
    expect(component.showPremiumModal).toBeTrue();
    expect(mockResumeApi.create).not.toHaveBeenCalled();
  });

  it('should create resume from template', () => {
    component.useTemplate();
    expect(mockResumeApi.create).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/builder', 100]);
  });

  it('should format category correctly', () => {
    expect(component.formatCategory('creative_modern')).toBe('Creative Modern');
  });

  it('should return correct previewImageUrl', () => {
    component.template = { thumbnailUrl: 'test.jpg' } as any;
    expect(component.previewImageUrl).toBe('test.jpg');
    
    component.template = {} as any;
    expect(component.previewImageUrl).toBeNull();

    component.template = null;
    expect(component.previewImageUrl).toBeNull();
  });

  it('should guard against calling useTemplate when already creating', () => {
    component.creating = true;
    component.useTemplate();
    expect(mockResumeApi.create).not.toHaveBeenCalled();
  });

  it('should guard against null template in useTemplate', () => {
    component.template = null;
    component.useTemplate();
    expect(mockResumeApi.create).not.toHaveBeenCalled();
  });

  it('should allow premium template if user has PREMIUM plan', () => {
    mockAuthService.getCurrentPlan.and.returnValue('PREMIUM');
    component.template = { tier: 'PREMIUM', templateId: 1, name: 'T1' } as any;
    component.useTemplate();
    expect(component.showPremiumModal).toBeFalse();
    expect(mockResumeApi.create).toHaveBeenCalled();
  });

  it('should fetch profile if getCurrentUserId returns null', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    component.template = { tier: 'FREE', templateId: 1, name: 'T1' } as any;
    mockAuthService.getProfile.and.returnValue(of({ userId: 99 }));
    component.useTemplate();
    expect(mockAuthService.getProfile).toHaveBeenCalled();
    expect(mockResumeApi.create).toHaveBeenCalled();
  });

  it('should show error if profile fetch fails and resolvedId is null', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    component.template = { tier: 'FREE', templateId: 1, name: 'T1' } as any;
    mockAuthService.getProfile.and.returnValue(throwError(() => new Error('fail')));
    component.useTemplate();
    expect(component.error).toContain('Could not verify your identity');
    expect(component.creating).toBeFalse();
  });

  it('should set error 403 message on create resume failure', () => {
    component.template = { tier: 'FREE', templateId: 1, name: 'T1' } as any;
    mockResumeApi.create.and.returnValue(throwError(() => ({ status: 403 })));
    component.useTemplate();
    expect(component.error).toContain('Resume limit reached');
    expect(component.creating).toBeFalse();
  });

  it('should set generic error on create resume failure (non-403)', () => {
    component.template = { tier: 'FREE', templateId: 1, name: 'T1' } as any;
    mockResumeApi.create.and.returnValue(throwError(() => ({ status: 500 })));
    component.useTemplate();
    expect(component.error).toContain('Could not create resume');
    expect(component.creating).toBeFalse();
  });
});

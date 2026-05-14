import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicResumeViewComponent } from './public-resume-view.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ResumeApiService } from '../services/resume-api.service';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationPollingService } from '../../notifications/services/notification-polling.service';
import { SectionApiService } from '../../builder/services/section-api.service';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

describe('PublicResumeViewComponent', () => {
  let component: PublicResumeViewComponent;
  let fixture: ComponentFixture<PublicResumeViewComponent>;
  let mockResumeApi: any;
  let mockTemplateService: any;
  let mockAuthService: any;
  let mockSectionApi: any;
  let mockTemplateRenderer: any;
  let mockRouter: any;
  let paramsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    paramsSubject = new BehaviorSubject({ get: () => '1' });

    mockResumeApi = {
      getPublic: jasmine.createSpy('getPublic').and.returnValue(of([{ resumeId: 1, title: 'Resume 1', templateId: 1, viewCount: 5 }])),
      incrementViewCount: jasmine.createSpy('incrementViewCount').and.returnValue(of({})),
      create: jasmine.createSpy('create').and.returnValue(of({ resumeId: 100 }))
    };

    mockTemplateService = {
      getAllTemplates: jasmine.createSpy('getAllTemplates').and.returnValue(of([{ templateId: 1, name: 'T1', tier: 'FREE' }])),
      getTemplateById: jasmine.createSpy('getTemplateById').and.returnValue(of({ templateId: 1, htmlLayout: '<div></div>' })),
      incrementUsage: jasmine.createSpy('incrementUsage').and.returnValue(of({}))
    };

    mockAuthService = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ userId: 99 })),
      getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue('FREE'),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(99),
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
    };

    mockSectionApi = {
      getSections: jasmine.createSpy('getSections').and.returnValue(of([{ type: 'EXPERIENCE' }]))
    };

    mockTemplateRenderer = {
      renderDocument: jasmine.createSpy('renderDocument').and.returnValue('<html></html>')
    };

    await TestBed.configureTestingModule({
      imports: [PublicResumeViewComponent, RouterTestingModule],
      providers: [
        { provide: ResumeApiService, useValue: mockResumeApi },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SectionApiService, useValue: mockSectionApi },
        { provide: TemplateRenderService, useValue: mockTemplateRenderer },
        { provide: NotificationPollingService, useValue: { startPolling: jasmine.createSpy(), stopPolling: jasmine.createSpy(), unreadCount$: of(0) } },
        {
          provide: ActivatedRoute,
          useValue: { 
            paramMap: paramsSubject.asObservable(),
            snapshot: { queryParamMap: { get: () => null } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicResumeViewComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
  });

  it('should load resume and related data', () => {
    expect(mockResumeApi.getPublic).toHaveBeenCalled();
    expect(component.resume?.resumeId).toBe(1);
    expect(component.resume?.viewCount).toBe(6); 
    expect(component.templateSummary?.templateId).toBe(1);
    expect(component.sections.length).toBe(1);
    expect(component.previewSrcdoc).toBe('<html></html>');
  });

  it('should handle invalid resume link', () => {
    paramsSubject.next({ get: () => 'abc' });
    expect(component.error).toContain('Invalid resume link');
  });

  it('should handle missing resume', () => {
    paramsSubject.next({ get: () => '999' });
    expect(component.error).toContain('could not be found');
  });

  it('should navigate to register if not logged in on useTemplate', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    component.useTemplate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register'], jasmine.any(Object));
  });

  it('should navigate to pricing if premium template chosen on free plan', () => {
    component.templateSummary = { templateId: 1, tier: 'PREMIUM' } as any;
    component.useTemplate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pricing'], jasmine.any(Object));
  });

  it('should create resume from template', () => {
    component.useTemplate();
    expect(mockResumeApi.create).toHaveBeenCalled();
    expect(mockTemplateService.incrementUsage).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/builder', 100]);
  });

  it('should format category correctly', () => {
    expect(component.formatCategory('creative_modern')).toBe('Creative Modern');
  });

  it('should return correct ctaLabel', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    expect(component.ctaLabel).toBe('Sign up to use this template');
    
    mockAuthService.isLoggedIn.and.returnValue(true);
    expect(component.ctaLabel).toBe('Use this template');
    
    component.templateSummary = { tier: 'PREMIUM' } as any;
    expect(component.ctaLabel).toBe('Upgrade to use this template');

    component.templateSummary = null;
    expect(component.ctaLabel).toBe('Use this template');
  });

  it('should not increment view count if already counted', () => {
    // We need to re-initialize or mock snapshots correctly
    (component as any).route.snapshot.queryParamMap.get = (key: string) => key === 'counted' ? 'true' : null;
    mockResumeApi.incrementViewCount.calls.reset();
    paramsSubject.next({ get: () => '1' });
    expect(mockResumeApi.incrementViewCount).not.toHaveBeenCalled();
  });

  it('should handle incrementViewCount error', () => {
    mockResumeApi.incrementViewCount.and.returnValue(throwError(() => new Error('err')));
    paramsSubject.next({ get: () => '1' });
    expect(component.loading).toBeFalse();
    expect(component.resume).toBeTruthy();
  });

  it('should handle resume.create 403 error', () => {
    mockResumeApi.create.and.returnValue(throwError(() => ({ status: 403 })));
    component.useTemplate();
    expect(component.actionError).toContain('limit reached');
  });

  it('should handle resume.create generic error', () => {
    mockResumeApi.create.and.returnValue(throwError(() => ({ status: 500 })));
    component.useTemplate();
    expect(component.actionError).toContain('Could not create a resume');
  });

  it('should fallback to getProfile if getCurrentUserId is null', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    mockAuthService.getProfile.and.returnValue(of({ userId: 123 }));
    component.useTemplate();
    expect(mockAuthService.getProfile).toHaveBeenCalled();
    expect(mockResumeApi.create).toHaveBeenCalledWith(jasmine.objectContaining({ userId: 123 }));
  });

  it('should handle getProfile error in useTemplate', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    mockAuthService.getProfile.and.returnValue(throwError(() => new Error('fail')));
    component.useTemplate();
    expect(component.actionError).toContain('Could not verify your account');
  });

  it('should return null for previewSrcdoc if resume or template missing', () => {
    component.resume = null;
    expect(component.previewSrcdoc).toBeNull();
    component.resume = { resumeId: 1 } as any;
    component.template = null;
    expect(component.previewSrcdoc).toBeNull();
  });

  it('should guard against creating state in useTemplate', () => {
    component.creating = true;
    component.useTemplate();
    expect(mockResumeApi.create).not.toHaveBeenCalled();
  });

  it('should handle incrementUsage error silently', () => {
    mockTemplateService.incrementUsage.and.returnValue(throwError(() => new Error('err')));
    component.useTemplate();
    expect(mockResumeApi.create).toHaveBeenCalled();
  });

  it('should guard writePreviewFrame against null elements', () => {
    (component as any).previewIframe = null;
    expect(() => (component as any).writePreviewFrame()).not.toThrow();
  });

  it('should guard previewFrameRef setter against null', () => {
    expect(() => component.previewFrameRef = undefined).not.toThrow();
  });

  it('should handle templates.getAllTemplates error', () => {
    mockTemplateService.getAllTemplates.and.returnValue(throwError(() => new Error('err')));
    paramsSubject.next({ get: () => '1' });
    expect(component.templateSummary).toBeNull();
  });

  it('should handle resumeApi.getPublic error', () => {
    // In actual component, getPublic error is caught and returns of([]).
    // If [].find returns undefined, it sets 'could not be found' error.
    mockResumeApi.getPublic.and.returnValue(throwError(() => new Error('api fail')));
    paramsSubject.next({ get: () => '1' });
    expect(component.error).toContain('could not be found');
  });

  it('should handle resolvedId is null in useTemplate', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    mockAuthService.getProfile.and.returnValue(of(null));
    component.useTemplate();
    expect(component.actionError).toContain('Could not verify your account');
  });

  it('should handle forkJoin error in ngOnInit', () => {
    // Force the first forkJoin result to have empty resumes
    mockResumeApi.getPublic.and.returnValue(of([]));
    paramsSubject.next({ get: () => '1' });
    expect(component.error).toContain('could not be found');
  });

  it('should format multi-word category correctly', () => {
    expect(component.formatCategory('tech_and_business')).toBe('Tech And Business');
  });

  it('should guard createResumeFromTemplate against missing templateSummary', () => {
    component.templateSummary = null;
    (component as any).createResumeFromTemplate(123);
    expect(mockResumeApi.create).not.toHaveBeenCalled();
  });
});

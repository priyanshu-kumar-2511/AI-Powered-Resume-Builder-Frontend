import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateResumeComponent } from './create-resume.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import { ResumeApiService } from '../services/resume-api.service';
import { ResumeStateService } from '../services/resume-state.service';
import { NotificationPollingService } from '../../notifications/services/notification-polling.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('CreateResumeComponent', () => {
  let component: CreateResumeComponent;
  let fixture: ComponentFixture<CreateResumeComponent>;
  let mockAuthService: any;
  let mockTemplateService: any;
  let mockResumeApi: any;
  let mockResumeState: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue('FREE'),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1),
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({})),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ fullName: 'John Doe' })
    };

    mockTemplateService = {
      getFreeTemplates: jasmine.createSpy('getFreeTemplates').and.returnValue(of([{ templateId: 1, name: 'Free', tier: 'FREE' }])),
      getPremiumTemplates: jasmine.createSpy('getPremiumTemplates').and.returnValue(of([{ templateId: 2, name: 'Premium', tier: 'PREMIUM' }])),
      incrementUsage: jasmine.createSpy('incrementUsage').and.returnValue(of({}))
    };

    mockResumeApi = {
      create: jasmine.createSpy('create').and.returnValue(of({ resumeId: 100, title: 'My Resume' }))
    };

    mockResumeState = {
      add: jasmine.createSpy('add')
    };

    await TestBed.configureTestingModule({
      imports: [CreateResumeComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ResumeApiService, useValue: mockResumeApi },
        { provide: ResumeStateService, useValue: mockResumeState },
        { provide: NotificationPollingService, useValue: { startPolling: jasmine.createSpy(), stopPolling: jasmine.createSpy(), unreadCount$: of(0) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => '1' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateResumeComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
  });

  it('should create and load templates', () => {
    expect(component).toBeTruthy();
    expect(mockTemplateService.getFreeTemplates).toHaveBeenCalled();
    expect(mockTemplateService.getPremiumTemplates).toHaveBeenCalled();
    expect(component.freeTemplates.length).toBe(1);
    expect(component.premiumTemplates.length).toBe(1);
    expect(component.selectedTemplateId).toBe(1); // Set from ActivatedRoute
  });

  it('should go to next step if valid', () => {
    component.step = 1;
    component.selectedTemplateId = 1;
    component.nextStep();
    expect(component.step).toBe(2);

    component.form.patchValue({ targetJobTitle: 'Dev', language: 'en' });
    component.nextStep();
    expect(component.step).toBe(3);
  });

  it('should not go to next step if no template chosen', () => {
    component.step = 1;
    component.selectedTemplateId = null;
    component.nextStep();
    expect(component.step).toBe(1);
    expect(component.error).toEqual('Please choose a template before continuing.');
  });

  it('should not go to next step if premium template chosen on free plan', () => {
    component.step = 1;
    component.selectedTemplateId = 2; // Premium
    component.nextStep();
    expect(component.step).toBe(1);
    expect(component.error).toEqual('This template is available on the premium plan only.');
  });

  it('should go to previous step', () => {
    component.step = 2;
    component.previousStep();
    expect(component.step).toBe(1);
  });

  it('should choose template', () => {
    component.chooseTemplate({ templateId: 1, name: 'Free', tier: 'FREE' } as any);
    expect(component.selectedTemplateId).toBe(1);
    
    // Attempt premium on free plan
    component.chooseTemplate({ templateId: 2, name: 'Prem', tier: 'PREMIUM' } as any);
    expect(component.selectedTemplateId).toBe(1); // Should not change
  });

  it('should create resume', () => {
    component.step = 3;
    component.selectedTemplateId = 1;
    component.form.patchValue({ targetJobTitle: 'Dev', language: 'en', title: 'My Resume' });
    component.createResume();

    expect(mockResumeApi.create).toHaveBeenCalled();
    expect(mockResumeState.add).toHaveBeenCalled();
    expect(mockTemplateService.incrementUsage).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/builder', 100]);
  });

  it('should handle create resume error', () => {
    component.step = 3;
    component.selectedTemplateId = 1;
    component.form.patchValue({ targetJobTitle: 'Dev', language: 'en', title: 'My Resume' });
    mockResumeApi.create.and.returnValue(throwError(() => new Error('Creation failed')));
    component.createResume();
    expect(component.error).toEqual('Resume creation failed. Please try again.');
  });

  it('should not create if userId is null', () => {
    mockAuthService.getCurrentUserId.and.returnValue(null);
    component.step = 3;
    component.selectedTemplateId = 1;
    component.form.patchValue({ targetJobTitle: 'Dev', language: 'en', title: 'My Resume' });
    component.createResume();
    expect(component.error).toEqual('We could not resolve your account identity for resume creation.');
    expect(mockResumeApi.create).not.toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeDashboardComponent } from './resume-dashboard.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import { ResumeApiService } from '../services/resume-api.service';
import { ResumeStateService } from '../services/resume-state.service';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { Component, Input, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../shared/services/confirm.service';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

@Component({ selector: 'app-resume-card', standalone: true, template: '' })
class MockResumeCardComponent {
  @Input() resume: any;
  @Input() template: any;
  @Input() disableActions = false;
}

describe('ResumeDashboardComponent', () => {
  let component: ResumeDashboardComponent;
  let fixture: ComponentFixture<ResumeDashboardComponent>;
  let mockAuth: any;
  let mockResumeState: any;
  let mockResumeApi: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
      url: '/dashboard'
    };
    mockAuth = {
      currentUser: signal({ subscriptionPlan: 'FREE' }),
      getProfile:  jasmine.createSpy('getProfile').and.returnValue(of({ subscriptionPlan: 'FREE' })),
      getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue('FREE')
    };
    mockResumeApi = {
      duplicate: jasmine.createSpy('duplicate').and.returnValue(of({ resumeId: 2 })),
      delete:    jasmine.createSpy('delete').and.returnValue(of({})),
      publish:   jasmine.createSpy('publish').and.returnValue(of({ resumeId: 1, isPublic: true })),
      unpublish: jasmine.createSpy('unpublish').and.returnValue(of({ resumeId: 1, isPublic: false })),
      update:    jasmine.createSpy('update').and.returnValue(of({ resumeId: 1 }))
    };
    mockResumeState = {
      resumes$: new BehaviorSubject<any[]>([{ resumeId: 1, title: 'R1', isPublic: false }]),
      load:     jasmine.createSpy('load').and.returnValue(of([])),
      add:      jasmine.createSpy('add'),
      remove:   jasmine.createSpy('remove'),
      update:   jasmine.createSpy('update')
    };

    const mockConfirm = {
      ask: jasmine.createSpy('ask').and.returnValue(Promise.resolve(true)),
      alert: jasmine.createSpy('alert').and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      imports: [ResumeDashboardComponent, HttpClientTestingModule, CommonModule],
      providers: [
        { provide: Router,               useValue: mockRouter },
        { provide: AuthService,          useValue: mockAuth },
        { provide: TemplateService,      useValue: { getAllTemplates: () => of([]) } },
        { provide: ResumeApiService,     useValue: mockResumeApi },
        { provide: ResumeStateService,   useValue: mockResumeState },
        { provide: ConfirmService,       useValue: mockConfirm }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ResumeDashboardComponent, {
      set: { imports: [CommonModule, MockNavbarComponent, MockResumeCardComponent], schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and load data', () => {
    fixture.detectChanges();
    expect(mockAuth.getProfile).toHaveBeenCalled();
    expect(mockResumeState.load).toHaveBeenCalled();
    expect(component.resumes.length).toBe(1);
  });

  it('should navigate to create new', () => {
    fixture.detectChanges();
    component.createNewResume();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/resumes/new']);
  });

  it('should navigate to edit', () => {
    component.editResume({ resumeId: 1 } as any);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/builder', 1]);
  });

  it('should not delete resume if not confirmed', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(false));
    await component.deleteResume({ resumeId: 1, title: 'R1' } as any);
    expect(mockResumeApi.delete).not.toHaveBeenCalled();
  });

  it('should delete resume after confirmation and handle success', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    await component.deleteResume({ resumeId: 1, title: 'R1' } as any);
    expect(mockResumeApi.delete).toHaveBeenCalledWith(1);
    expect(mockResumeState.remove).toHaveBeenCalledWith(1);
  });

  it('should handle duplicate resume', () => {
    fixture.detectChanges();
    component.resumes = [{ resumeId: 1 } as any];
    component.duplicateResume({ resumeId: 1, title: 'R1' } as any);
    expect(mockResumeApi.duplicate).toHaveBeenCalledWith(1);
    expect(mockResumeState.add).toHaveBeenCalled();
  });

  it('should block duplicate if free plan limit reached', () => {
    fixture.detectChanges();
    component.profile = { subscriptionPlan: 'FREE' } as any;
    component.resumes = [{} as any, {} as any, {} as any];
    component.duplicateResume({ resumeId: 1, title: 'R1' } as any);
    expect(mockResumeApi.duplicate).not.toHaveBeenCalled();
  });

  it('should handle togglePublish (publish)', () => {
    component.togglePublish({ resumeId: 1, title: 'R1', isPublic: false } as any);
    expect(mockResumeApi.publish).toHaveBeenCalledWith(1);
    expect(mockResumeState.update).toHaveBeenCalled();
  });

  it('should handle togglePublish (unpublish)', () => {
    component.togglePublish({ resumeId: 1, title: 'R1', isPublic: true } as any);
    expect(mockResumeApi.unpublish).toHaveBeenCalledWith(1);
    expect(mockResumeState.update).toHaveBeenCalled();
  });

  it('should toggle resume status', () => {
    mockResumeApi.update.and.returnValue(of({ resumeId: 1, status: 'DRAFT' }));
    component.toggleResumeStatus({ resumeId: 1, status: 'COMPLETE' } as any);
    expect(mockResumeApi.update).toHaveBeenCalledWith(1, { status: 'DRAFT' });
    expect(mockResumeState.update).toHaveBeenCalled();
  });

  it('should return template from map', () => {
    component.templateMap.set(5, { templateId: 5, name: 'T5' } as any);
    expect(component.templateFor(5)?.name).toBe('T5');
    expect(component.templateFor(99)).toBeNull();
    expect(component.templateFor(null)).toBeNull();
  });

  it('should allow duplicate if premium even with many resumes', () => {
    fixture.detectChanges();
    component.profile = { subscriptionPlan: 'PREMIUM' } as any;
    component.resumes = [{} as any, {} as any, {} as any, {} as any, {} as any];
    component.duplicateResume({ resumeId: 1 } as any);
    expect(mockResumeApi.duplicate).toHaveBeenCalled();
  });

  it('should toggle status from DRAFT to COMPLETE', () => {
    component.toggleResumeStatus({ resumeId: 1, status: 'DRAFT' } as any);
    expect(mockResumeApi.update).toHaveBeenCalledWith(1, { status: 'COMPLETE' });
  });

  it('should handle duplicate error', () => {
    mockResumeApi.duplicate.and.returnValue(throwError(() => new Error('err')));
    component.duplicateResume({ resumeId: 1 } as any);
    expect(mockResumeState.add).not.toHaveBeenCalled();
    expect(component.busyResumeId).toBeNull();
  });

  it('should handle delete error', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    mockResumeApi.delete.and.returnValue(throwError(() => new Error('err')));
    await component.deleteResume({ resumeId: 1 } as any);
    expect(mockResumeState.remove).not.toHaveBeenCalled();
  });

  it('should handle togglePublish error', () => {
    mockResumeApi.publish.and.returnValue(throwError(() => new Error('err')));
    component.togglePublish({ resumeId: 1, isPublic: false } as any);
    expect(mockResumeState.update).not.toHaveBeenCalled();
  });

  it('should handle toggleResumeStatus error', () => {
    mockResumeApi.update.and.returnValue(throwError(() => new Error('err')));
    component.toggleResumeStatus({ resumeId: 1, status: 'DRAFT' } as any);
    expect(mockResumeState.update).not.toHaveBeenCalled();
  });

  it('should handle template load failure', () => {
    const templateSvc = TestBed.inject(TemplateService);
    spyOn(templateSvc, 'getAllTemplates').and.returnValue(throwError(() => new Error('err')));
    component.ngOnInit();
    expect(component.templateMap.size).toBe(0);
  });

  it('should allow createNew if premium even with many resumes', () => {
    fixture.detectChanges();
    component.profile = { subscriptionPlan: 'PREMIUM' } as any;
    component.resumes = [{} as any, {} as any, {} as any];
    component.createNewResume();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/resumes/new']);
  });

  it('should calculate average ATS score correctly', () => {
    component.resumes = [{ atsScore: 80 }, { atsScore: 90 }, { atsScore: 10 }] as any;
    expect(component.averageAtsScore).toBe(60);
    component.resumes = [];
    expect(component.averageAtsScore).toBe(0);
  });

  it('should return publishedCount and completeCount', () => {
    component.resumes = [
      { isPublic: true, status: 'COMPLETE' },
      { isPublic: false, status: 'DRAFT' },
      { isPublic: true, status: 'DRAFT' }
    ] as any;
    expect(component.publishedCount).toBe(2);
    expect(component.completeCount).toBe(1);
  });
});

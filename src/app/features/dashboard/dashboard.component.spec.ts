import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth.service';
import { ResumeStateService } from '../resume/services/resume-state.service';
import { TemplateService } from '../../core/services/template.service';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuth: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));

    mockAuth = jasmine.createSpyObj('AuthService', ['isAdmin', 'getProfile', 'isLoggedIn', 'currentUser']);
    mockAuth.isAdmin.and.returnValue(false);
    mockAuth.getProfile.and.returnValue(of({ fullName: 'Test User' }));
    mockAuth.isLoggedIn.and.returnValue(true);
    mockAuth.currentUser.and.returnValue({ fullName: 'Test User' });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule, CommonModule],
      providers: [
        { provide: Router,             useValue: mockRouter },
        { provide: AuthService,        useValue: mockAuth },
        { provide: ResumeStateService, useValue: { load: () => of([]), resumes$: of([]) } },
        { provide: TemplateService,    useValue: { getPopularTemplates: () => of([]) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(DashboardComponent, {
      set: { imports: [CommonModule, MockNavbarComponent], schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and load data', () => {
    fixture.detectChanges();
    expect(mockAuth.getProfile).toHaveBeenCalled();
  });

  it('should redirect if admin', () => {
    mockAuth.isAdmin.and.returnValue(true);
    component.ngOnInit();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('should fallback to currentUser if getProfile fails', () => {
    mockAuth.getProfile.and.returnValue(throwError(() => new Error('Fail')));
    mockAuth.currentUser.and.returnValue({ fullName: 'Fallback User' });
    fixture.detectChanges();
    expect(component.profile?.fullName).toBe('Fallback User');
    expect(component.loadingProfile).toBeFalse();
  });

  it('should handle template API failure gracefully', () => {
    const templateSvc = TestBed.inject(TemplateService) as any;
    spyOn(templateSvc, 'getPopularTemplates').and.returnValue(throwError(() => new Error('Fail')));
    fixture.detectChanges();
    expect(component.popular).toEqual([]);
    expect(component.loadingTemplates).toBeFalse();
  });

  it('should handle resume API failure gracefully', () => {
    const resumeSvc = TestBed.inject(ResumeStateService) as any;
    spyOn(resumeSvc, 'load').and.returnValue(throwError(() => new Error('Fail')));
    fixture.detectChanges();
    expect(component.stats[0].value).toBe('0');
  });

  it('should calculate greeting based on time of day', () => {
    const originalDate = Date;
    
    // Morning (9 AM)
    spyOn(globalThis, 'Date').and.returnValue({ getHours: () => 9 } as any);
    expect(component.greeting).toBe('Good morning');
    
    // Afternoon (2 PM)
    (globalThis.Date as any).and.returnValue({ getHours: () => 14 } as any);
    expect(component.greeting).toBe('Good afternoon');
    
    // Evening (8 PM)
    (globalThis.Date as any).and.returnValue({ getHours: () => 20 } as any);
    expect(component.greeting).toBe('Good evening');

    globalThis.Date = originalDate;
  });

  it('should extract first name or fallback to "there"', () => {
    component.profile = { fullName: 'John Doe' } as any;
    expect(component.firstName).toBe('John');

    component.profile = null;
    expect(component.firstName).toBe('there');
  });

  it('should format category correctly', () => {
    expect(component.formatCategory('SOFTWARE_ENGINEER')).toBe('Software Engineer');
  });
});

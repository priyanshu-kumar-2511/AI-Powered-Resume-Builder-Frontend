import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeBuilderComponent } from './resume-builder.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TemplateService } from '../../../core/services/template.service';
import { of, throwError } from 'rxjs';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Resume, Template } from '../../../shared/models/models';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

@Component({ selector: 'app-resume-settings', standalone: true, template: '' })
class MockResumeSettingsComponent {
  @Input() resumeId!: number;
  @Output() resumeLoaded = new EventEmitter<Resume>();
  @Output() resumeChange = new EventEmitter<Resume>();
}

describe('ResumeBuilderComponent', () => {
  let component: ResumeBuilderComponent;
  let fixture: ComponentFixture<ResumeBuilderComponent>;
  let mockTemplateService: any;
  let mockActivatedRoute: any;

  const mockResume: Resume = {
    resumeId: 123,
    title: 'Software Engineer',
    targetJobTitle: 'DevOps',
    templateId: 10,
    status: 'DRAFT',
    language: 'en',
    atsScore: 85,
    updatedAt: new Date().toISOString()
  } as any;

  const mockTemplate: Template = {
    templateId: 10,
    name: 'Modern',
    htmlLayout: '<div>{{name}}</div>',
    cssStyles: 'div { color: red; }',
    thumbnailUrl: 'thumb.png'
  } as any;

  beforeEach(async () => {
    mockTemplateService = {
      getTemplateById: jasmine.createSpy('getTemplateById').and.returnValue(of(mockTemplate))
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('123')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ResumeBuilderComponent],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ActivatedRoute,   useValue: mockActivatedRoute }
      ]
    })
    .overrideComponent(ResumeBuilderComponent, {
      set: {
        imports: [MockNavbarComponent, MockResumeSettingsComponent, CommonModule, RouterLink]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeBuilderComponent);
    component = fixture.componentInstance;
  });

  it('should create and set resumeId from route', () => {
    expect(component).toBeTruthy();
    expect(component.resumeId).toBe(123);
  });

  it('should handle handleResumeLoaded and load template', () => {
    component.handleResumeLoaded(mockResume);
    expect(component.resume).toEqual(mockResume);
    expect(mockTemplateService.getTemplateById).toHaveBeenCalledWith(10);
    expect(component.template).toEqual(mockTemplate);
    expect(component.loadingTemplate).toBeFalse();
  });

  it('should NOT reload template if same templateId is loaded again', () => {
    component.handleResumeLoaded(mockResume);
    mockTemplateService.getTemplateById.calls.reset();
    component.handleResumeLoaded(mockResume);
    expect(mockTemplateService.getTemplateById).not.toHaveBeenCalled();
  });

  it('should handle template load error', () => {
    mockTemplateService.getTemplateById.and.returnValue(throwError(() => new Error('fail')));
    component.handleResumeLoaded(mockResume);
    expect(component.template).toBeNull();
    expect(component.loadingTemplate).toBeFalse();
  });

  it('safePreview should return sanitized HTML with styles', () => {
    component.template = mockTemplate;
    const preview = component.safePreview;
    expect(preview).toBeTruthy();
    // We can't easily check the content of SafeHtml but we know it's not null
  });

  it('safePreview should return null if no template or layout', () => {
    component.template = null;
    expect(component.safePreview).toBeNull();
    
    component.template = { htmlLayout: '' } as any;
    expect(component.safePreview).toBeNull();
  });

  it('should show thumbnail if layout is empty', () => {
    component.template = { htmlLayout: '', thumbnailUrl: 'img.png' } as any;
    fixture.detectChanges();
    expect(component.safePreview).toBeNull();
  });

  it('should set template to null if resume has no templateId', () => {
    component.handleResumeLoaded({ ...mockResume, templateId: null } as any);
    expect(component.template).toBeNull();
    expect(mockTemplateService.getTemplateById).not.toHaveBeenCalled();
  });
});

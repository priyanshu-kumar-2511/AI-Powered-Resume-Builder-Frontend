import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicGalleryComponent } from './public-gallery.component';
import { ResumeApiService } from '../services/resume-api.service';
import { TemplateService } from '../../../core/services/template.service';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

describe('PublicGalleryComponent', () => {
  let component: PublicGalleryComponent;
  let fixture: ComponentFixture<PublicGalleryComponent>;
  let mockResumeApi: any;
  let mockTemplateSvc: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true))
    };
    mockResumeApi = {
      getPublic: jasmine.createSpy('getPublic').and.returnValue(of([
        { resumeId: 1, title: 'R1', viewCount: 10, targetJobTitle: 'Dev' },
        { resumeId: 2, title: 'R2', viewCount: 20, targetJobTitle: 'Designer' }
      ])),
      incrementViewCount: jasmine.createSpy('incrementViewCount').and.returnValue(of({}))
    };
    mockTemplateSvc = {
      getAllTemplates: jasmine.createSpy('getAllTemplates').and.returnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [PublicGalleryComponent, HttpClientTestingModule, CommonModule],
      providers: [
        { provide: Router,           useValue: mockRouter },
        { provide: ResumeApiService, useValue: mockResumeApi },
        { provide: TemplateService,  useValue: mockTemplateSvc }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(PublicGalleryComponent, {
      set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicGalleryComponent);
    component = fixture.componentInstance;
  });

  it('should load public resumes on init', () => {
    fixture.detectChanges();
    expect(mockResumeApi.getPublic).toHaveBeenCalled();
    expect(component.resumes.length).toBe(2);
    expect(component.resumes[0].resumeId).toBe(2);
  });

  it('should filter resumes by searchTerm', () => {
    fixture.detectChanges();
    component.searchTerm = 'Designer';
    expect(component.filteredResumes.length).toBe(1);
    expect(component.filteredResumes[0].title).toBe('R2');
  });

  it('should navigate to public resume view', () => {
    fixture.detectChanges();
    const resume = { resumeId: 1, title: 'R1', viewCount: 10 } as any;
    component.openResume(resume);
    expect(mockResumeApi.incrementViewCount).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/resumes/public', 1], jasmine.any(Object));
  });

  it('should navigate to resume on incrementViewCount error', () => {
    fixture.detectChanges();
    mockResumeApi.incrementViewCount.and.returnValue(throwError(() => new Error('fail')));
    const resume = { resumeId: 2, title: 'R2', viewCount: 5 } as any;
    component.openResume(resume);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/resumes/public', 2]);
    expect(component.viewingResumeId).toBeNull();
  });

  it('should handle load error gracefully', () => {
    mockResumeApi.getPublic.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    // catchError returns [], so resumes stays empty
    expect(component.resumes.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should filter by title when targetJobTitle is empty', () => {
    fixture.detectChanges();
    component.searchTerm = 'R1';
    expect(component.filteredResumes.length).toBe(1);
    expect(component.filteredResumes[0].resumeId).toBe(1);
  });

  it('should return all resumes when searchTerm is empty', () => {
    fixture.detectChanges();
    component.searchTerm = '';
    expect(component.filteredResumes.length).toBe(2);
  });

  it('should reset page on search change', () => {
    fixture.detectChanges();
    component.page = 3;
    component.onSearchChange();
    expect(component.page).toBe(1);
  });

  it('should paginate resumes correctly', () => {
    const manyResumes = Array.from({ length: 10 }, (_, i) => ({
      resumeId: i + 1, title: `R${i + 1}`, viewCount: i, targetJobTitle: ''
    }));
    fixture.detectChanges();
    component.resumes = manyResumes as any;
    expect(component.totalPages).toBe(2);
    expect(component.paginatedResumes.length).toBe(6);
    component.goToPage(2);
    expect(component.paginatedResumes.length).toBe(4);
    expect(component.pageNumbers.length).toBe(2);
  });

  it('should return template for valid templateId', () => {
    fixture.detectChanges();
    component.templateMap.set(10, { templateId: 10, name: 'T10' } as any);
    expect(component.templateFor(10)).toEqual({ templateId: 10, name: 'T10' } as any);
    expect(component.templateFor(null)).toBeNull();
    expect(component.templateFor(99)).toBeNull();
  });
});

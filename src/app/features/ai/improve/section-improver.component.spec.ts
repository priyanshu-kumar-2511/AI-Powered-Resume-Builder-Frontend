import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionImproverComponent } from './section-improver.component';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';

describe('SectionImproverComponent', () => {
  let component: SectionImproverComponent;
  let fixture: ComponentFixture<SectionImproverComponent>;
  let mockAiApi: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAiApi = {
      improveSection: jasmine.createSpy('improveSection').and.returnValue(
        of({ content: 'Improved section content here.' })
      )
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(5),
      getCurrentPlan:   jasmine.createSpy('getCurrentPlan').and.returnValue('PREMIUM')
    };

    await TestBed.configureTestingModule({
      imports: [SectionImproverComponent, FormsModule],
      providers: [
        { provide: AiApiService, useValue: mockAiApi },
        { provide: AuthService,  useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SectionImproverComponent);
    component = fixture.componentInstance;
    component.resumeId = 8;
    spyOn(component.contentApplied, 'emit');
    fixture.detectChanges();
  });

  it('should create in premium mode', () => {
    expect(component).toBeTruthy();
    expect(component.isPremium).toBeTrue();
  });

  it('should return isPremium = false for FREE plan', () => {
    mockAuthService.getCurrentPlan.and.returnValue('FREE');
    expect(component.isPremium).toBeFalse();
  });

  it('should set selectedSection from ngOnChanges if type is valid', () => {
    component.selectedSectionType = 'SUMMARY';
    component.ngOnChanges({
      selectedSectionType: new SimpleChange(null, 'SUMMARY', true)
    });
    expect(component.selectedSection).toBe('SUMMARY');
  });

  it('should not set selectedSection if type is not in sectionTypes', () => {
    component.selectedSection = '';
    component.ngOnChanges({
      selectedSectionType: new SimpleChange(null, 'EXPERIENCE', true) // not in SECTION_TYPES
    });
    expect(component.selectedSection).toBe('');
  });

  it('should set editableContent from ngOnChanges when currentContent changes', () => {
    component.currentContent = 'Some initial content';
    component.ngOnChanges({
      currentContent: new SimpleChange(null, 'Some initial content', true)
    });
    expect(component.editableContent).toBe('Some initial content');
  });

  it('should not call api if editableContent is empty on improve()', () => {
    component.editableContent = '';
    component.improve();
    expect(mockAiApi.improveSection).not.toHaveBeenCalled();
  });

  it('should call improveSection API and set improved content', () => {
    component.selectedSection = 'SUMMARY';
    component.editableContent = 'Original summary content for improvement.';
    component.improve();

    expect(mockAiApi.improveSection).toHaveBeenCalledWith({
      userId: '5',
      resumeId: 8,
      sectionType: 'SUMMARY',
      existingContent: 'Original summary content for improvement.'
    });
    expect(component.improved).toBe('Improved section content here.');
    expect(component.loading).toBeFalse();
  });

  it('should handle improve error with backend message', () => {
    mockAiApi.improveSection.and.returnValue(
      throwError(() => ({ error: { message: 'AI quota exceeded' } }))
    );
    component.editableContent = 'Some content to improve.';
    component.improve();

    expect(component.error).toBe('AI quota exceeded');
    expect(component.loading).toBeFalse();
  });

  it('should use fallback error message', () => {
    mockAiApi.improveSection.and.returnValue(throwError(() => ({})));
    component.editableContent = 'Some content.';
    component.improve();
    expect(component.error).toBe('Failed to improve section.');
  });

  it('should apply changes and emit contentApplied', () => {
    component.improved = 'Improved section content here.';
    component.applyChanges();

    expect(component.contentApplied.emit).toHaveBeenCalledWith('Improved section content here.');
    expect(component.improved).toBe('');
  });

  it('should have correct sectionTypes list', () => {
    expect(component.sectionTypes).toContain('SUMMARY');
    expect(component.sectionTypes).toContain('PROJECTS');
    expect(component.sectionTypes).toContain('CERTIFICATIONS');
    expect(component.sectionTypes).not.toContain('EXPERIENCE');
  });
});

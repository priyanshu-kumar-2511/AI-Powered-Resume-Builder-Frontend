import { TestBed } from '@angular/core/testing';
import { BuilderStateService } from './builder-state.service';
import { Resume, ResumeSection, Template } from '../../../shared/models/models';

describe('BuilderStateService', () => {
  let service: BuilderStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BuilderStateService]
    });
    service = TestBed.inject(BuilderStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Sections Management', () => {
    const mockSection1: ResumeSection = {
      sectionId: 1, resumeId: 10, sectionType: 'SUMMARY', title: 'Summary',
      content: '', displayOrder: 1, isVisible: true, aiGenerated: false,
      createdAt: '', updatedAt: ''
    };
    const mockSection2: ResumeSection = {
      sectionId: 2, resumeId: 10, sectionType: 'EXPERIENCE', title: 'Experience',
      content: '', displayOrder: 0, isVisible: true, aiGenerated: false,
      createdAt: '', updatedAt: ''
    };

    it('should set and sort sections', () => {
      service.setSections([mockSection1, mockSection2]);
      const current = service.sectionsSnapshot;
      expect(current.length).toBe(2);
      expect(current[0].sectionId).toBe(2); // displayOrder 0 comes first
      expect(current[1].sectionId).toBe(1);
    });

    it('should add a section and maintain sort', () => {
      service.setSections([mockSection1]);
      service.addSection(mockSection2);
      
      const current = service.sectionsSnapshot;
      expect(current.length).toBe(2);
      expect(current[0].sectionId).toBe(2);
    });

    it('should update an existing section', () => {
      service.setSections([mockSection1]);
      const updatedSection = { ...mockSection1, title: 'Updated Summary' };
      
      service.updateSection(updatedSection);
      
      const current = service.sectionsSnapshot;
      expect(current[0].title).toBe('Updated Summary');
    });

    it('should remove a section by id', () => {
      service.setSections([mockSection1, mockSection2]);
      service.removeSection(1);
      
      const current = service.sectionsSnapshot;
      expect(current.length).toBe(1);
      expect(current[0].sectionId).toBe(2);
    });

    it('should reorder sections based on array of ids', () => {
      service.setSections([mockSection1, mockSection2]);
      
      // Order them as 1 then 2
      service.reorderSections([1, 2]);
      
      const current = service.sectionsSnapshot;
      expect(current[0].sectionId).toBe(1);
      expect(current[0].displayOrder).toBe(0);
      expect(current[1].sectionId).toBe(2);
      expect(current[1].displayOrder).toBe(1);
    });
  });

  describe('Resume Management', () => {
    it('should set resume state', () => {
      const mockResume: Resume = {
        resumeId: 1, userId: 1, title: 'Test', targetJobTitle: 'Dev',
        templateId: null, atsScore: 0, status: 'DRAFT', language: 'en',
        isPublic: false, viewCount: 0, createdAt: '', updatedAt: ''
      };
      
      service.setResume(mockResume);
      expect(service.resumeSnapshot).toEqual(mockResume);
    });
  });

  describe('Template Management', () => {
    it('should set template state', () => {
      const mockTemplate: Template = {
        templateId: 1, name: 'Basic', description: 'Desc',
        thumbnailUrl: '', category: 'PROFESSIONAL', tier: 'FREE',
        usageCount: 0, htmlLayout: '', cssStyles: '', isActive: true,
        createdAt: '', updatedAt: ''
      };
      
      service.setTemplate(mockTemplate);
      expect(service.templateSnapshot).toEqual(mockTemplate);
    });
  });

  describe('Font Controls', () => {
    it('should set font size within bounds', () => {
      service.setFontSize(20);
      expect(service.fontSnapshot.fontSize).toBe(20);

      service.setFontSize(5); // Below min
      expect(service.fontSnapshot.fontSize).toBe(6);

      service.setFontSize(40); // Above max
      expect(service.fontSnapshot.fontSize).toBe(32);
    });

    it('should increase font size', () => {
      service.setFontSize(12);
      service.increaseFontSize();
      expect(service.fontSnapshot.fontSize).toBe(13);
    });

    it('should decrease font size', () => {
      service.setFontSize(12);
      service.decreaseFontSize();
      expect(service.fontSnapshot.fontSize).toBe(11);
    });

    it('should set font family', () => {
      service.setFontFamily('Roboto');
      expect(service.fontSnapshot.fontFamily).toBe('Roboto');
    });
  });

  describe('Reset', () => {
    it('should clear all state', () => {
      service.setSections([{ sectionId: 1 } as ResumeSection]);
      service.setResume({ resumeId: 1 } as Resume);
      service.setTemplate({ templateId: 1 } as Template);
      
      service.reset();
      
      expect(service.sectionsSnapshot.length).toBe(0);
      expect(service.resumeSnapshot).toBeNull();
      expect(service.templateSnapshot).toBeNull();
      // Note: Font state is not cleared in reset() currently
    });
  });
});

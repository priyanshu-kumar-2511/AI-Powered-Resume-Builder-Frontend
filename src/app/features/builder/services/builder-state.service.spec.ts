import { TestBed } from '@angular/core/testing';
import { BuilderStateService } from './builder-state.service';

describe('BuilderStateService', () => {
  let service: BuilderStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BuilderStateService]
    });
    service = TestBed.inject(BuilderStateService);
  });

  it('should initialize with default state', () => {
    expect(service.resumeSnapshot).toBeNull();
    expect(service.sectionsSnapshot).toEqual([]);
    expect(service.fontSnapshot.fontSize).toBe(11);
  });

  it('should set sections and sort them', () => {
    const sections = [
      { sectionId: 2, displayOrder: 1 } as any,
      { sectionId: 1, displayOrder: 0 } as any
    ];
    service.setSections(sections);
    expect(service.sectionsSnapshot[0].sectionId).toBe(1);
    expect(service.sectionsSnapshot[1].sectionId).toBe(2);
  });

  it('should add a section', () => {
    service.addSection({ sectionId: 3, displayOrder: 2 } as any);
    expect(service.sectionsSnapshot.length).toBe(1);
  });

  it('should update a section', () => {
    service.setSections([{ sectionId: 1, content: 'old', displayOrder: 0 } as any]);
    service.updateSection({ sectionId: 1, content: 'new', displayOrder: 0 } as any);
    expect(service.sectionsSnapshot[0].content).toBe('new');
  });

  it('should remove a section', () => {
    service.setSections([{ sectionId: 1, displayOrder: 0 } as any]);
    service.removeSection(1);
    expect(service.sectionsSnapshot.length).toBe(0);
  });

  it('should reorder sections', () => {
    service.setSections([
      { sectionId: 1, displayOrder: 0 } as any,
      { sectionId: 2, displayOrder: 1 } as any
    ]);
    service.reorderSections([2, 1]);
    expect(service.sectionsSnapshot[0].sectionId).toBe(2);
    expect(service.sectionsSnapshot[0].displayOrder).toBe(0);
    expect(service.sectionsSnapshot[1].sectionId).toBe(1);
    expect(service.sectionsSnapshot[1].displayOrder).toBe(1);
  });

  it('should handle font size changes within bounds', () => {
    service.setFontSize(35); // Max 32
    expect(service.fontSnapshot.fontSize).toBe(32);
    
    service.setFontSize(2); // Min 6
    expect(service.fontSnapshot.fontSize).toBe(6);
    
    service.increaseFontSize();
    expect(service.fontSnapshot.fontSize).toBe(7);
  });

  it('should parse customizations from resume', () => {
    const customizations = JSON.stringify({ fontSize: 14, fontFamily: 'Roboto', primaryColor: '#ff0000' });
    service.setResume({ customizations } as any);
    expect(service.fontSnapshot.fontSize).toBe(14);
    expect(service.fontSnapshot.fontFamily).toBe('Roboto');
  });

  it('should reset state', () => {
    service.setSections([{ sectionId: 1 } as any]);
    service.reset();
    expect(service.sectionsSnapshot.length).toBe(0);
    expect(service.resumeSnapshot).toBeNull();
  });

  it('should decrease font size and clamp at minimum 6', () => {
    service.setFontSize(7);
    service.decreaseFontSize();
    expect(service.fontSnapshot.fontSize).toBe(6);
    service.decreaseFontSize(); // already at 6, stays 6
    expect(service.fontSnapshot.fontSize).toBe(6);
  });

  it('should guard setPrimaryColor against empty string', () => {
    const before = service.fontSnapshot.primaryColor;
    service.setPrimaryColor('');
    expect(service.fontSnapshot.primaryColor).toBe(before);
  });

  it('should update primary color and font family', () => {
    service.setPrimaryColor('#abcdef');
    expect(service.fontSnapshot.primaryColor).toBe('#abcdef');
    service.setFontFamily('Roboto');
    expect(service.fontSnapshot.fontFamily).toBe('Roboto');
  });

  it('should handle setResume with null (no customizations parse)', () => {
    service.setResume(null);
    expect(service.resumeSnapshot).toBeNull();
    // Font should stay at defaults
    expect(service.fontSnapshot.fontSize).toBe(11);
  });

  it('should handle setResume with invalid JSON customizations gracefully', () => {
    spyOn(console, 'error');
    const badResume = { customizations: '{invalid json}', resumeId: 1 } as any;
    expect(() => service.setResume(badResume)).not.toThrow();
    // Font stays at default since JSON.parse threw
    expect(service.fontSnapshot.fontSize).toBe(11);
  });

  it('should handle setResume with partial customizations (use defaults for missing)', () => {
    const partialCustom = JSON.stringify({ fontSize: 16 }); // no fontFamily or primaryColor
    service.setResume({ customizations: partialCustom, resumeId: 2 } as any);
    expect(service.fontSnapshot.fontSize).toBe(16);
    expect(service.fontSnapshot.fontFamily).toBe('Inter'); // default
    expect(service.fontSnapshot.primaryColor).toBe('#00d4b4'); // default
  });

  it('should skip unknown ids in reorderSections', () => {
    service.setSections([
      { sectionId: 1, displayOrder: 0 } as any,
      { sectionId: 2, displayOrder: 1 } as any
    ]);
    service.reorderSections([2, 99, 1]); // 99 doesn't exist
    expect(service.sectionsSnapshot.length).toBe(2);
    expect(service.sectionsSnapshot[0].sectionId).toBe(2);
  });

  it('should set user profile and template', () => {
    service.setUserProfile({ userId: 5, fullName: 'Test' } as any);
    expect(service.userProfileSnapshot?.userId).toBe(5);
    service.setTemplate({ templateId: 3 } as any);
    expect(service.templateSnapshot?.templateId).toBe(3);
    service.setTemplate(null);
    expect(service.templateSnapshot).toBeNull();
  });
});

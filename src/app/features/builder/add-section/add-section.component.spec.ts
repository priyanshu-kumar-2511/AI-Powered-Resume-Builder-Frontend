import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSectionComponent } from './add-section.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SectionApiService } from '../services/section-api.service';
import { BuilderStateService } from '../services/builder-state.service';
import { of, throwError } from 'rxjs';

describe('AddSectionComponent', () => {
  let component: AddSectionComponent;
  let fixture: ComponentFixture<AddSectionComponent>;
  let mockSectionApi: any;
  let mockBuilderState: any;

  const mockSection = { sectionId: 5, sectionType: 'SKILLS', title: 'Skills', displayOrder: 0, isVisible: true };

  beforeEach(async () => {
    mockSectionApi = {
      addSection: jasmine.createSpy('addSection').and.returnValue(of(mockSection))
    };

    mockBuilderState = {
      addSection:       jasmine.createSpy('addSection'),
      sectionsSnapshot: []
    };

    await TestBed.configureTestingModule({
      imports: [AddSectionComponent, ReactiveFormsModule],
      providers: [
        { provide: SectionApiService,   useValue: mockSectionApi },
        { provide: BuilderStateService, useValue: mockBuilderState },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddSectionComponent);
    component = fixture.componentInstance;
    component.resumeId = 10;
    spyOn(component.sectionAdded, 'emit');
    spyOn(component.cancelled, 'emit');
    fixture.detectChanges();
  });

  it('should create with empty form', () => {
    expect(component).toBeTruthy();
    expect(component.selectedType).toBeNull();
    expect(component.form.value.title).toBe('');
  });

  it('should select a section type and set default title', () => {
    const skillsOption = component.sectionOptions.find(o => o.type === 'SKILLS')!;
    component.selectType(skillsOption);
    expect(component.selectedType).toBe('SKILLS');
    expect(component.form.controls.title.value).toBe('Skills');
  });

  it('should show error if add() called without selecting type', () => {
    component.add();
    expect(component.error).toBe('Please select a section type.');
    expect(mockSectionApi.addSection).not.toHaveBeenCalled();
  });

  it('should add section and emit sectionAdded', () => {
    const skillsOption = component.sectionOptions.find(o => o.type === 'SKILLS')!;
    component.selectType(skillsOption);
    component.add();

    expect(mockSectionApi.addSection).toHaveBeenCalled();
    expect(mockBuilderState.addSection).toHaveBeenCalledWith(mockSection as any);
    expect(component.sectionAdded.emit).toHaveBeenCalledWith(mockSection as any);
    expect(component.adding).toBeFalse();
  });

  it('should show error on addSection failure', () => {
    mockSectionApi.addSection.and.returnValue(throwError(() => new Error('error')));
    const skillsOption = component.sectionOptions.find(o => o.type === 'SKILLS')!;
    component.selectType(skillsOption);
    component.add();

    expect(component.error).toContain('Could not add section');
    expect(component.adding).toBeFalse();
  });

  it('should emit cancelled on cancel()', () => {
    component.cancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should have 9 section options', () => {
    expect(component.sectionOptions.length).toBe(9);
  });

  it('should generate correct defaultContent for all section types', () => {
    const getDefault = (type: any) => (component as any).defaultContent(type);

    expect(getDefault('SUMMARY')).toBe(JSON.stringify({ text: '' }));
    expect(getDefault('EXPERIENCE')).toBe(JSON.stringify([]));
    expect(getDefault('EDUCATION')).toBe(JSON.stringify([]));
    expect(getDefault('SKILLS')).toBe(JSON.stringify([]));
    expect(getDefault('CUSTOM')).toBe(JSON.stringify({ text: '' }));
    expect(getDefault('UNKNOWN_TYPE')).toBe(JSON.stringify({ html: '' }));
  });
});

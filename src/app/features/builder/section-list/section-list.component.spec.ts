import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionListComponent } from './section-list.component';
import { BuilderStateService } from '../services/builder-state.service';
import { SectionApiService } from '../services/section-api.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ResumeSection } from '../../../shared/models/models';

describe('SectionListComponent', () => {
  let component: SectionListComponent;
  let fixture: ComponentFixture<SectionListComponent>;
  let mockBuilderState: any;
  let mockSectionApi: any;
  let sectionsSubject: BehaviorSubject<ResumeSection[]>;

  const makeSections = (): ResumeSection[] => [
    { sectionId: 1, sectionType: 'SUMMARY',    title: 'Summary',    displayOrder: 0, isVisible: true } as any,
    { sectionId: 2, sectionType: 'EXPERIENCE', title: 'Experience', displayOrder: 1, isVisible: false } as any,
    { sectionId: 3, sectionType: 'SKILLS',     title: 'Skills',     displayOrder: 2, isVisible: true } as any,
  ];

  beforeEach(async () => {
    sectionsSubject = new BehaviorSubject<ResumeSection[]>(makeSections());

    mockBuilderState = {
      sections$: sectionsSubject.asObservable(),
      updateSection: jasmine.createSpy('updateSection'),
      setSections:   jasmine.createSpy('setSections'),
    };

    mockSectionApi = {
      toggleVisibility: jasmine.createSpy('toggleVisibility').and.returnValue(
        of({ sectionId: 2, isVisible: true } as any)
      ),
      reorder: jasmine.createSpy('reorder').and.returnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [SectionListComponent],
      providers: [
        { provide: BuilderStateService, useValue: mockBuilderState },
        { provide: SectionApiService,   useValue: mockSectionApi },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SectionListComponent);
    component = fixture.componentInstance;
    component.resumeId = 10;
    fixture.detectChanges();
  });

  it('should subscribe to sections$ on init', () => {
    expect(component.sections.length).toBe(3);
    expect(component.sections[0].title).toBe('Summary');
  });

  it('should return correct icon for known types', () => {
    expect(component.iconFor('SUMMARY')).toBe('📝');
    expect(component.iconFor('EXPERIENCE')).toBe('💼');
    expect(component.iconFor('UNKNOWN')).toBe('📄');
  });

  it('should emit sectionSelected on select()', () => {
    spyOn(component.sectionSelected, 'emit');
    component.select(component.sections[0]);
    expect(component.sectionSelected.emit).toHaveBeenCalledWith(component.sections[0]);
  });

  it('should toggle visibility and update state', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.toggleVisibility(event, component.sections[1]);

    expect(event.stopPropagation).toHaveBeenCalled();
    // togglingId is cleared after observable completes (synchronously with of())
    expect(mockSectionApi.toggleVisibility).toHaveBeenCalledWith(2);
    expect(mockBuilderState.updateSection).toHaveBeenCalledWith({ sectionId: 2, isVisible: true } as any);
    expect(component.togglingId).toBeNull(); // cleared after sync observable
  });

  it('should clear togglingId on toggleVisibility error', () => {
    mockSectionApi.toggleVisibility.and.returnValue(throwError(() => new Error('error')));
    const event = new MouseEvent('click');
    component.toggleVisibility(event, component.sections[0]);
    expect(component.togglingId).toBeNull();
  });

  it('should move section up', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.moveUp(event, 1); // Move index 1 up
    expect(mockBuilderState.setSections).toHaveBeenCalled();
    expect(mockSectionApi.reorder).toHaveBeenCalled();
  });

  it('should not move first section up', () => {
    const event = new MouseEvent('click');
    component.moveUp(event, 0);
    expect(mockBuilderState.setSections).not.toHaveBeenCalled();
  });

  it('should move section down', () => {
    const event = new MouseEvent('click');
    component.moveDown(event, 1); // Move index 1 down
    expect(mockBuilderState.setSections).toHaveBeenCalled();
    expect(mockSectionApi.reorder).toHaveBeenCalled();
  });

  it('should not move last section down', () => {
    const event = new MouseEvent('click');
    component.moveDown(event, 2); // Last index
    expect(mockBuilderState.setSections).not.toHaveBeenCalled();
  });

  it('should update sections when state emits new values', () => {
    sectionsSubject.next([{ sectionId: 99, title: 'New', sectionType: 'CUSTOM' } as any]);
    expect(component.sections.length).toBe(1);
    expect(component.sections[0].sectionId).toBe(99);
  });
});

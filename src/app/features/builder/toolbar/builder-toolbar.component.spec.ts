import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuilderToolbarComponent } from './builder-toolbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BuilderStateService } from '../services/builder-state.service';
import { AutoSaveService } from '../services/auto-save.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { BehaviorSubject, of } from 'rxjs';
import { Resume } from '../../../shared/models/models';

describe('BuilderToolbarComponent', () => {
  let component: BuilderToolbarComponent;
  let fixture: ComponentFixture<BuilderToolbarComponent>;
  let resumeSubject: BehaviorSubject<Resume | null>;
  let mockBuilderState: any;

  beforeEach(async () => {
    resumeSubject = new BehaviorSubject<Resume | null>(null);

    mockBuilderState = {
      resume$: resumeSubject.asObservable()
    };

    const mockAutoSave = {
      status$: of('saved'),
      lastSavedAt: new Date(),
    };

    const mockResumeApi = {
      getById: jasmine.createSpy().and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [BuilderToolbarComponent, RouterTestingModule],
      providers: [
        { provide: BuilderStateService, useValue: mockBuilderState },
        { provide: AutoSaveService,     useValue: mockAutoSave },
        { provide: ResumeApiService,    useValue: mockResumeApi },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderToolbarComponent);
    component = fixture.componentInstance;
    component.resumeId = 10;
    fixture.detectChanges();
  });

  it('should create and subscribe to resume$', () => {
    expect(component).toBeTruthy();
    expect(component.resume).toBeNull();
  });

  it('should update resume when state emits', () => {
    const mockResume = { resumeId: 10, title: 'My Resume', atsScore: 85 } as Resume;
    resumeSubject.next(mockResume);
    expect(component.resume?.title).toBe('My Resume');
  });

  it('should return green atsColor for score >= 80', () => {
    resumeSubject.next({ atsScore: 85 } as Resume);
    expect(component.atsColor).toBe('var(--teal)');
  });

  it('should return amber atsColor for score between 50 and 79', () => {
    resumeSubject.next({ atsScore: 65 } as Resume);
    expect(component.atsColor).toBe('#f59e0b');
  });

  it('should return red atsColor for score < 50', () => {
    resumeSubject.next({ atsScore: 30 } as Resume);
    expect(component.atsColor).toBe('#ef4444');
  });

  it('should return correct atsRing gradient', () => {
    resumeSubject.next({ atsScore: 100 } as Resume);
    const ring = component.atsRing;
    expect(ring).toContain('360deg');
    expect(ring).toContain('conic-gradient');
  });

  it('should use score 0 defaults when resume is null', () => {
    resumeSubject.next(null);
    expect(component.atsColor).toBe('#ef4444');
    expect(component.atsRing).toContain('0deg');
  });
});

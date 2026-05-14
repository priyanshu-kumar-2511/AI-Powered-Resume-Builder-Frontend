import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks, flush } from '@angular/core/testing';
import { ResumeTailorComponent } from './resume-tailor.component';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('ResumeTailorComponent', () => {
  let component: ResumeTailorComponent;
  let fixture: ComponentFixture<ResumeTailorComponent>;
  let mockAiApi: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAiApi = {
      tailorResume: jasmine.createSpy('tailorResume').and.returnValue(
        of({ content: 'Tailored resume content for the job.' })
      ),
      getHistory: jasmine.createSpy('getHistory').and.returnValue(of([]))
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(9),
      getCurrentPlan:   jasmine.createSpy('getCurrentPlan').and.returnValue('PREMIUM')
    };

    await TestBed.configureTestingModule({
      imports: [ResumeTailorComponent, FormsModule],
      providers: [
        { provide: AiApiService, useValue: mockAiApi },
        { provide: AuthService,  useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeTailorComponent);
    component = fixture.componentInstance;
    component.resumeId = 15;
    component.resumeContent = 'My current resume content.';
    spyOn(component.changesApplied, 'emit');
    fixture.detectChanges();
  });

  it('should create with empty initial state', () => {
    expect(component).toBeTruthy();
    expect(component.result).toBe('');
    expect(component.loading).toBeFalse();
  });

  it('should return isPremium = true for PREMIUM plan', () => {
    expect(component.isPremium).toBeTrue();
  });

  it('should return isPremium = false for FREE plan', () => {
    mockAuthService.getCurrentPlan.and.returnValue('FREE');
    expect(component.isPremium).toBeFalse();
  });

  it('should call tailorResume API with correct payload', () => {
    component.jobDescription = 'Senior developer position at big tech.';
    component.tailor();

    expect(mockAiApi.tailorResume).toHaveBeenCalledWith({
      userId: '9',
      resumeId: 15,
      existingContent: 'My current resume content.',
      jobDescription: 'Senior developer position at big tech.'
    });
  });

  it('should handle direct content response (non-QUEUED)', () => {
    component.jobDescription = 'Frontend role at startup.';
    component.tailor();

    expect(component.result).toBe('Tailored resume content for the job.');
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should set loading and progressLabel while tailoring', () => {
    // Spy before calling to capture interim state
    let capturedLoading = false;
    mockAiApi.tailorResume.and.callFake(() => {
      capturedLoading = component.loading;
      return of({ content: 'Done' });
    });

    component.jobDescription = 'Some job desc';
    component.tailor();

    expect(capturedLoading).toBeTrue();
    expect(component.progressLabel).toBe('Analysing resume…');
  });

  it('should handle tailor API error', () => {
    mockAiApi.tailorResume.and.returnValue(
      throwError(() => ({ error: { message: 'AI service unavailable' } }))
    );
    component.jobDescription = 'Some job desc.';
    component.tailor();

    expect(component.error).toBe('AI service unavailable');
    expect(component.loading).toBeFalse();
  });

  it('should use fallback error message', () => {
    mockAiApi.tailorResume.and.returnValue(throwError(() => ({})));
    component.jobDescription = 'Some desc.';
    component.tailor();
    expect(component.error).toBe('Failed to tailor resume.');
  });

  it('should apply all changes and emit changesApplied', () => {
    component.result = 'Tailored resume content for the job.';
    component.applyAll();

    expect(component.changesApplied.emit).toHaveBeenCalledWith('Tailored resume content for the job.');
    expect(component.result).toBe('');
  });

  it('should have all 4 progress step labels', () => {
    const steps = (component as any).progressSteps;
    expect(steps).toContain('Analysing resume…');
    expect(steps).toContain('Matching keywords…');
    expect(steps).toContain('Rewriting sections…');
    expect(steps).toContain('Finalising changes…');
  });

  it('should handle QUEUED status and poll history', fakeAsync(() => {
    mockAiApi.tailorResume.and.returnValue(of({ status: 'QUEUED' }));
    
    // Initial history is empty
    mockAiApi.getHistory.and.returnValue(of([]));
    
    component.jobDescription = 'JD';
    component.tailor();
    expect(component.progressLabel).toBe('Background worker processing…');
    
    // Simulate finding the result in history with a future timestamp to ensure it matches
    mockAiApi.getHistory.and.returnValue(of([{ 
      requestType: 'TAILOR_RESUME', 
      timestamp: new Date(Date.now() + 10000).toISOString(), 
      response: 'Async result' 
    }]));
    
    tick(3000); // Trigger poll interval
    
    expect(component.result).toBe('Async result');
    expect(component.loading).toBeFalse();
    
    // The timers are cleared by the component itself now because latest is found
  }));

  it('should timeout after 60 seconds if QUEUED', fakeAsync(() => {
    mockAiApi.tailorResume.and.returnValue(of({ status: 'QUEUED' }));
    mockAiApi.getHistory.and.returnValue(of([])); // Never returns a result
    
    component.jobDescription = 'JD';
    component.tailor();
    
    tick(60000); // Wait for the 60s timeout
    
    expect(component.error).toBe('Background processing took too long. Please check your history panel later.');
    expect(component.loading).toBeFalse();
    
    discardPeriodicTasks();
  }));
});

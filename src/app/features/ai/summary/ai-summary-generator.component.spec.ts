import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiSummaryGeneratorComponent } from './ai-summary-generator.component';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('AiSummaryGeneratorComponent', () => {
  let component: AiSummaryGeneratorComponent;
  let fixture: ComponentFixture<AiSummaryGeneratorComponent>;
  let mockAiApi: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAiApi = {
      generateSummary: jasmine.createSpy('generateSummary').and.returnValue(
        of({ content: 'Generated professional summary text.' })
      )
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(42)
    };

    await TestBed.configureTestingModule({
      imports: [AiSummaryGeneratorComponent, FormsModule],
      providers: [
        { provide: AiApiService,  useValue: mockAiApi },
        { provide: AuthService,   useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiSummaryGeneratorComponent);
    component = fixture.componentInstance;
    component.resumeId = 5;
    fixture.detectChanges();
  });

  it('should create with empty state', () => {
    expect(component).toBeTruthy();
    expect(component.result).toBe('');
    expect(component.loading).toBeFalse();
  });

  it('should not generate if jobTitle is empty', () => {
    component.jobTitle = '';
    component.generate();
    expect(mockAiApi.generateSummary).not.toHaveBeenCalled();
  });

  it('should generate summary successfully', () => {
    component.jobTitle = 'Software Engineer';
    component.yearsExp = 3;
    component.generate();

    expect(mockAiApi.generateSummary).toHaveBeenCalledWith({
      userId: '42',
      resumeId: 5,
      targetJobTitle: 'Software Engineer',
      existingContent: 'Years of experience: 3'
    });
    expect(component.result).toBe('Generated professional summary text.');
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should handle generation error', () => {
    mockAiApi.generateSummary.and.returnValue(
      throwError(() => ({ error: { message: 'Quota exceeded' } }))
    );
    component.jobTitle = 'Designer';
    component.generate();

    expect(component.error).toBe('Quota exceeded');
    expect(component.loading).toBeFalse();
    expect(component.result).toBe('');
  });

  it('should use fallback error message when no message in error', () => {
    mockAiApi.generateSummary.and.returnValue(throwError(() => ({})));
    component.jobTitle = 'Designer';
    component.generate();
    expect(component.error).toBe('AI generation failed. Please try again.');
  });

  it('should accept result and emit summaryAccepted', () => {
    spyOn(component.summaryAccepted, 'emit');
    component.result = 'A great summary.';
    component.accept();

    expect(component.summaryAccepted.emit).toHaveBeenCalledWith('A great summary.');
    expect(component.result).toBe('');
  });

  it('should discard result', () => {
    component.result = 'Something generated.';
    component.discard();
    expect(component.result).toBe('');
  });
});

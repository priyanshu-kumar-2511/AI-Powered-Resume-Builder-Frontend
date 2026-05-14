import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AtsCheckerComponent } from './ats-checker.component';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuotaStateService } from '../services/quota-state.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('AtsCheckerComponent', () => {
  let component: AtsCheckerComponent;
  let fixture: ComponentFixture<AtsCheckerComponent>;
  let mockAiApi: any;
  let mockAuth: any;
  let mockQuota: any;

  beforeEach(async () => {
    mockAiApi = {
      checkAts: jasmine.createSpy('checkAts').and.returnValue(of({ 
        score: 85, 
        suggestions: ['Good'], 
        missingKeywords: ['Skill1'] 
      }))
    };
    mockAuth = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1)
    };
    mockQuota = {
      getSnapshot: jasmine.createSpy('getSnapshot').and.returnValue({ 
        isPremium: false, 
        remainingAts: 2 
      })
    };

    await TestBed.configureTestingModule({
      imports: [AtsCheckerComponent, CommonModule, FormsModule],
      providers: [
        { provide: AiApiService,       useValue: mockAiApi },
        { provide: AuthService,        useValue: mockAuth },
        { provide: QuotaStateService,  useValue: mockQuota }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AtsCheckerComponent);
    component = fixture.componentInstance;
    component.resumeId = 1;
    component.resumeContent = 'My Resume Content';
  });

  it('should initialize', () => {
    fixture.detectChanges();
    expect(component.quota.remainingAts).toBe(2);
  });

  it('should run ATS check successfully', () => {
    fixture.detectChanges();
    component.jobDescription = 'Job Desc';
    component.runCheck();
    
    expect(mockAiApi.checkAts).toHaveBeenCalled();
    expect(component.report?.score).toBe(85);
  });

  it('should handle check error fallback message', () => {
    mockAiApi.checkAts.and.returnValue(throwError(() => ({}))); // No error.message
    fixture.detectChanges();
    component.runCheck();
    expect(component.error).toBe('ATS check failed. Please try again.');
  });

  it('should calculate score colors and labels for all ranges', () => {
    // Fair range
    component.report = { score: 60, suggestions: [], missingKeywords: [] };
    expect(component.scoreColor).toBe('#f59e0b');
    expect(component.scoreLabel).toContain('Fair');

    // Null report
    component.report = null;
    expect(component.scoreColor).toBe('#ef4444');
    expect(component.scoreLabel).toContain('Poor');
    expect(component.scoreDash).toBe(`0 ${2 * Math.PI * 15.9}`);

    // Excellent range
    component.report = { score: 85, suggestions: [], missingKeywords: [] };
    expect(component.scoreColor).toBe('#00d4b4');
    expect(component.scoreLabel).toContain('Excellent');
    expect(component.scoreDash).toBe(`${0.85 * 2 * Math.PI * 15.9} ${2 * Math.PI * 15.9}`);

    // Poor range
    component.report = { score: 40, suggestions: [], missingKeywords: [] };
    expect(component.scoreColor).toBe('#ef4444');
    expect(component.scoreLabel).toContain('Poor');
  });

  it('should fallback to empty string for missing userId', () => {
    mockAuth.getCurrentUserId.and.returnValue(null);
    fixture.detectChanges();
    component.jobDescription = 'Job Desc';
    component.runCheck();
    
    expect(mockAiApi.checkAts).toHaveBeenCalledWith(jasmine.objectContaining({ userId: '' }));
  });

  it('should handle check error', () => {
    mockAiApi.checkAts.and.returnValue(throwError(() => ({ error: { message: 'AI Fail' } })));
    fixture.detectChanges();
    component.runCheck();
    expect(component.error).toBe('AI Fail');
  });
});


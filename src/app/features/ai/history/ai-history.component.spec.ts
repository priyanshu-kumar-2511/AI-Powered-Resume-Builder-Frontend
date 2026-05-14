import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiHistoryComponent } from './ai-history.component';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { AiHistoryRecord } from '../models/ai.models';

describe('AiHistoryComponent', () => {
  let component: AiHistoryComponent;
  let fixture: ComponentFixture<AiHistoryComponent>;
  let mockAiApi: any;
  let mockAuthService: any;

  const makeRecords = (count: number): AiHistoryRecord[] =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      requestType: 'GENERATE_SUMMARY',
      inputPrompt: `Prompt ${i + 1}`,
      response: `Response ${i + 1}`,
      model: 'gemini-1.5',
      tokensUsed: 100,
      timestamp: new Date().toISOString()
    } as AiHistoryRecord));

  beforeEach(async () => {
    mockAiApi = {
      getHistory: jasmine.createSpy('getHistory').and.returnValue(
        of(makeRecords(3))
      )
    };

    mockAuthService = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(4),
      getCurrentPlan:   jasmine.createSpy('getCurrentPlan').and.returnValue('PREMIUM')
    };

    await TestBed.configureTestingModule({
      imports: [AiHistoryComponent],
      providers: [
        { provide: AiApiService, useValue: mockAiApi },
        { provide: AuthService,  useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load history for premium users', () => {
    expect(component).toBeTruthy();
    expect(mockAiApi.getHistory).toHaveBeenCalledWith('4');
    expect(component.records.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should return isPremium = true for PREMIUM plan', () => {
    expect(component.isPremium).toBeTrue();
  });

  it('should not load history for FREE plan users', () => {
    mockAuthService.getCurrentPlan.and.returnValue('FREE');
    mockAiApi.getHistory.calls.reset();
    component.ngOnInit();
    expect(mockAiApi.getHistory).not.toHaveBeenCalled();
  });

  it('should handle history load error gracefully', () => {
    mockAiApi.getHistory.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('should toggle expandedId on toggle()', () => {
    component.toggle(1);
    expect(component.expandedId).toBe(1);

    component.toggle(1); // same id — should collapse
    expect(component.expandedId).toBeNull();

    component.toggle(2);
    expect(component.expandedId).toBe(2);
  });

  it('should return correct typeIcon for known types', () => {
    expect(component.typeIcon('GENERATE_SUMMARY')).toBe('📝');
    expect(component.typeIcon('CHECK_ATS')).toBe('⚡');
    expect(component.typeIcon('TAILOR_RESUME')).toBe('🎯');
    expect(component.typeIcon('UNKNOWN_TYPE')).toBe('🤖');
  });

  it('should compute totalPages correctly', () => {
    component.records = makeRecords(25);
    expect(component.totalPages).toBe(3); // ceil(25/10)

    component.records = makeRecords(10);
    expect(component.totalPages).toBe(1);

    component.records = makeRecords(11);
    expect(component.totalPages).toBe(2);
  });

  it('should return correct pagedRecords for currentPage', () => {
    component.records = makeRecords(15);
    component.currentPage = 0;
    expect(component.pagedRecords.length).toBe(10);

    component.currentPage = 1;
    expect(component.pagedRecords.length).toBe(5);
  });
});

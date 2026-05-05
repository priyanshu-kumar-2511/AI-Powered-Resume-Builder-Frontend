import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiApiService } from './ai-api.service';
import { QuotaStateService } from './quota-state.service';
import { AI_API } from '../../../core/config/api.config';
import { AiRequest, AiResponse } from '../models/ai.models';

describe('AiApiService', () => {
  let service: AiApiService;
  let httpMock: HttpTestingController;
  let quotaState: QuotaStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiApiService, QuotaStateService]
    });
    service = TestBed.inject(AiApiService);
    httpMock = TestBed.inject(HttpTestingController);
    quotaState = TestBed.inject(QuotaStateService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate summary and decrement quota', () => {
    const mockRequest: AiRequest = { userId: '1', targetJobTitle: 'Dev' };
    const mockResponse: AiResponse = { content: 'Summary' };
    spyOn(quotaState, 'decrementSummary');

    service.generateSummary(mockRequest).subscribe(res => {
      expect(res.content).toBe('Summary');
    });

    const req = httpMock.expectOne(`${AI_API}/generate-summary`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(quotaState.decrementSummary).toHaveBeenCalled();
  });

  it('should get quota and update quota state', () => {
    const mockQuota = { summaryRemaining: 5, atsRemaining: 2 } as any;
    spyOn(quotaState, 'setQuota');

    service.getQuota('user-1').subscribe();

    const req = httpMock.expectOne(`${AI_API}/quota/user-1`);
    req.flush(mockQuota);

    expect(quotaState.setQuota).toHaveBeenCalledWith(mockQuota);
  });
});

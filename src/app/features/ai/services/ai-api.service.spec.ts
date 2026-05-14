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

  it('should generate bullets and decrement summary quota', () => {
    const req2: AiRequest = { userId: '2', resumeId: 5, existingContent: 'Lead team' };
    spyOn(quotaState, 'decrementSummary');

    service.generateBullets(req2).subscribe();

    const req = httpMock.expectOne(`${AI_API}/generate-bullets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(req2);
    req.flush({ content: 'Bullet 1\nBullet 2' });

    expect(quotaState.decrementSummary).toHaveBeenCalled();
  });

  it('should check ATS and decrement ATS quota', () => {
    const atsReq: AiRequest = { userId: '3', resumeId: 7, targetJobTitle: 'PM' };
    spyOn(quotaState, 'decrementAts');

    service.checkAts(atsReq).subscribe();

    const req = httpMock.expectOne(`${AI_API}/check-ats`);
    expect(req.request.method).toBe('POST');
    req.flush({ score: 78, missingKeywords: [], presentKeywords: [] });

    expect(quotaState.decrementAts).toHaveBeenCalled();
  });

  it('should suggest skills via GET with jobTitle param', () => {
    service.suggestSkills(10, 'Frontend Developer').subscribe(skills => {
      expect(skills).toEqual(['TypeScript', 'Angular']);
    });

    const req = httpMock.expectOne(r =>
      r.url === `${AI_API}/suggest-skills/10` && r.params.get('jobTitle') === 'Frontend Developer'
    );
    expect(req.request.method).toBe('GET');
    req.flush(['TypeScript', 'Angular']);
  });

  it('should get AI history via GET', () => {
    service.getHistory('user-5').subscribe(history => {
      expect(history.length).toBe(2);
    });

    const req = httpMock.expectOne(`${AI_API}/history/user-5`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }, { id: 2 }]);
  });

  it('should call improveSection POST endpoint', () => {
    const improveReq: AiRequest = { userId: '1', sectionType: 'SUMMARY', existingContent: 'Old' };
    service.improveSection(improveReq).subscribe();

    const req = httpMock.expectOne(`${AI_API}/improve-section`);
    expect(req.request.method).toBe('POST');
    req.flush({ content: 'Improved' });
  });

  it('should call tailorResume POST endpoint', () => {
    const tailorReq: AiRequest = { userId: '1', resumeId: 3, jobDescription: 'Senior Dev role' };
    service.tailorResume(tailorReq).subscribe();

    const req = httpMock.expectOne(`${AI_API}/tailor-resume`);
    expect(req.request.method).toBe('POST');
    req.flush({ content: 'Tailored resume' });
  });

  it('should call translateResume POST endpoint', () => {
    const translateReq: AiRequest = { userId: '1', resumeId: 3, targetLanguage: 'es' };
    service.translateResume(translateReq).subscribe();

    const req = httpMock.expectOne(`${AI_API}/translate-resume`);
    expect(req.request.method).toBe('POST');
    req.flush({ content: 'Traducción' });
  });

  it('should call generateCoverLetter POST endpoint', () => {
    const coverReq: AiRequest = { userId: '1', targetJobTitle: 'Dev', jobDescription: 'Build apps' };
    service.generateCoverLetter(coverReq).subscribe();

    const req = httpMock.expectOne(`${AI_API}/generate-cover-letter`);
    expect(req.request.method).toBe('POST');
    req.flush({ content: 'Dear Hiring Manager…' });
  });
});

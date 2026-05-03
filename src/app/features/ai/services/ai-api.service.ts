import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AiRequest, AiResponse, AtsReport, QuotaInfo,
  SuggestedSkills, AiHistoryRecord
} from '../models/ai.models';
import { QuotaStateService } from './quota-state.service';
import { AI_API } from '../../../core/config/api.config';

/**
 * Service for interacting with the AI-Service microservice.
 * Provides functionality for content generation, ATS scoring, and quota management.
 */
@Injectable({ providedIn: 'root' })
export class AiApiService {
  private http         = inject(HttpClient);
  private quotaState   = inject(QuotaStateService);

  // ── FREE endpoints ────────────────────────────────────────────────────────

  /**
   * Generates a professional summary using AI.
   * Decrements the user's summary quota on success.
   * @param request AI generation request details
   * @returns Observable with generated summary response
   */
  generateSummary(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/generate-summary`, request).pipe(
      tap(() => this.quotaState.decrementSummary())
    );
  }

  /**
   * Generates or improves work experience bullet points using AI.
   * Decrements the user's summary quota on success.
   * @param request AI generation request details
   * @returns Observable with generated bullet points response
   */
  generateBullets(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/generate-bullets`, request).pipe(
      tap(() => this.quotaState.decrementSummary())
    );
  }

  /**
   * Scores the resume content against a job title for ATS compatibility.
   * Decrements the user's ATS quota on success.
   * @param request ATS scoring request details
   * @returns Observable with ATS report (score and keywords)
   */
  checkAts(request: AiRequest): Observable<AtsReport> {
    return this.http.post<AtsReport>(`${AI_API}/check-ats`, request).pipe(
      tap(() => this.quotaState.decrementAts())
    );
  }

  /**
   * Suggests relevant skills for a given job title. This is a free endpoint.
   * @param resumeId The ID of the resume (for context tracking)
   * @param jobTitle The target job title
   * @returns Observable with an array of suggested skill strings
   */
  suggestSkills(resumeId: number, jobTitle: string): Observable<string[]> {
    return this.http.get<string[]>(`${AI_API}/suggest-skills/${resumeId}`, {
      params: { jobTitle }
    });
  }

  /**
   * Fetches the current AI quotas for a specific user and syncs with the local state.
   * @param userId The unique user identifier
   * @returns Observable with quota information
   */
  getQuota(userId: string): Observable<QuotaInfo> {
    return this.http.get<QuotaInfo>(`${AI_API}/quota/${userId}`).pipe(
      tap(q => this.quotaState.setQuota(q))
    );
  }

  // ── PREMIUM endpoints ─────────────────────────────────────────────────────

  /**
   * PREMIUM: Generates a tailored cover letter matching the target job description.
   * @param request AI generation request details
   * @returns Observable with the generated cover letter response
   */
  generateCoverLetter(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/generate-cover-letter`, request);
  }

  /**
   * PREMIUM: Rewrites a specific resume section (e.g., Education, Projects) for improved tone.
   * @param request AI improvement request details
   * @returns Observable with the improved section content
   */
  improveSection(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/improve-section`, request);
  }

  /**
   * PREMIUM: Deeply tailors the entire resume against a specific target job.
   * @param request AI tailoring request details (includes full resume JSON)
   * @returns Observable with the tailored resume data
   */
  tailorResume(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/tailor-resume`, request);
  }

  /**
   * PREMIUM: Translates the full resume into a target language while preserving layout integrity.
   * @param request AI translation request details
   * @returns Observable with the translated resume
   */
  translateResume(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/translate-resume`, request);
  }

  /**
   * PREMIUM: Fetches the chronological history of AI interactions for the user.
   * @param userId The unique user identifier
   * @returns Observable with an array of historical AI records
   */
  getHistory(userId: string): Observable<AiHistoryRecord[]> {
    return this.http.get<AiHistoryRecord[]>(`${AI_API}/history/${userId}`);
  }
}

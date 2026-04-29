import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AiRequest, AiResponse, AtsReport, QuotaInfo,
  SuggestedSkills, AiHistoryRecord
} from '../models/ai.models';
import { QuotaStateService } from './quota-state.service';
import { AI_API } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private http         = inject(HttpClient);
  private quotaState   = inject(QuotaStateService);

  // ── FREE endpoints ────────────────────────────────────────────────────────

  generateSummary(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/generate-summary`, request).pipe(
      tap(() => this.quotaState.decrementSummary())
    );
  }

  generateBullets(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/generate-bullets`, request).pipe(
      tap(() => this.quotaState.decrementSummary())
    );
  }

  checkAts(request: AiRequest): Observable<AtsReport> {
    return this.http.post<AtsReport>(`${AI_API}/check-ats`, request).pipe(
      tap(() => this.quotaState.decrementAts())
    );
  }

  suggestSkills(resumeId: number, jobTitle: string): Observable<string[]> {
    return this.http.get<string[]>(`${AI_API}/suggest-skills/${resumeId}`, {
      params: { jobTitle }
    });
  }

  getQuota(userId: string): Observable<QuotaInfo> {
    return this.http.get<QuotaInfo>(`${AI_API}/quota/${userId}`).pipe(
      tap(q => this.quotaState.setQuota(q))
    );
  }

  // ── PREMIUM endpoints ─────────────────────────────────────────────────────

  generateCoverLetter(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/generate-cover-letter`, request);
  }

  improveSection(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/improve-section`, request);
  }

  tailorResume(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/tailor-resume`, request);
  }

  translateResume(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${AI_API}/translate-resume`, request);
  }

  getHistory(userId: string): Observable<AiHistoryRecord[]> {
    return this.http.get<AiHistoryRecord[]>(`${AI_API}/history/${userId}`);
  }
}

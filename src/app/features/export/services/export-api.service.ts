import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, mapTo, switchMap, takeUntil, tap, timer } from 'rxjs';
import { ExportJob, ExportStats, ExportCustomization } from '../../../shared/models/models';

const BASE = '/api/v1/exports';

@Injectable({ providedIn: 'root' })
export class ExportApiService {
  private http = inject(HttpClient);

  // ── Submit jobs ──────────────────────────────────────────────────────────

  exportPdf(resumeId: number, customizations?: ExportCustomization): Observable<ExportJob> {
    return this.http.post<ExportJob>(
      `${BASE}/pdf/${resumeId}`,
      customizations ? JSON.stringify(customizations) : null,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  exportDocx(resumeId: number, customizations?: ExportCustomization): Observable<ExportJob> {
    return this.http.post<ExportJob>(
      `${BASE}/docx/${resumeId}`,
      customizations ? JSON.stringify(customizations) : null,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  exportJson(resumeId: number, customizations?: ExportCustomization): Observable<ExportJob> {
    return this.http.post<ExportJob>(
      `${BASE}/json/${resumeId}`,
      customizations ? JSON.stringify(customizations) : null,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Poll job status every 2s until stop$ fires ───────────────────────────

  pollJobStatus(jobId: string, stop$: Subject<void>): Observable<ExportJob> {
    return timer(0, 2000).pipe(
      takeUntil(stop$),
      switchMap(() => this.getJobStatus(jobId))
    );
  }

  getJobStatus(jobId: string): Observable<ExportJob> {
    return this.http.get<ExportJob>(`${BASE}/job/${jobId}`);
  }

  // ── User history ─────────────────────────────────────────────────────────

  getByUser(userId: number): Observable<ExportJob[]> {
    return this.http.get<ExportJob[]>(`${BASE}/user/${userId}`);
  }

  // ── Download ─────────────────────────────────────────────────────────────

  downloadFile(jobId: string, format: string, resumeId: number): Observable<void> {
    return this.http.get(`${BASE}/download/${jobId}`, { responseType: 'blob' }).pipe(
      tap((blob) => this.saveBlob(blob, format, resumeId)),
      mapTo(undefined)
    );
  }

  private saveBlob(blob: Blob, format: string, resumeId: number): void {
    const ext  = format.toLowerCase();
    const name = `resume_${resumeId}.${ext}`;
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  getStats(userId: number): Observable<ExportStats> {
    return this.http.get<ExportStats>(`${BASE}/stats/${userId}`);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  deleteExport(jobId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${jobId}`);
  }
}

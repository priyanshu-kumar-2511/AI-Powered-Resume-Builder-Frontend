import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateResumeRequest, Resume, UpdateResumeRequest } from '../../../shared/models/models';
import { RESUME_API } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ResumeApiService {
  private http = inject(HttpClient);

  create(payload: CreateResumeRequest): Observable<Resume> {
    return this.http.post<Resume>(RESUME_API, payload);
  }

  getById(resumeId: number): Observable<Resume> {
    return this.http.get<Resume>(`${RESUME_API}/${resumeId}`);
  }

  getByUser(userId: number): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${RESUME_API}/user/${userId}`);
  }

  getPublic(): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${RESUME_API}/public`);
  }

  update(resumeId: number, payload: UpdateResumeRequest): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}`, payload);
  }

  delete(resumeId: number): Observable<void> {
    return this.http.delete<void>(`${RESUME_API}/${resumeId}`);
  }

  duplicate(resumeId: number): Observable<Resume> {
    return this.http.post<Resume>(`${RESUME_API}/${resumeId}/duplicate`, {});
  }

  publish(resumeId: number): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}/publish`, {});
  }

  unpublish(resumeId: number): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}/unpublish`, {});
  }

  incrementViewCount(resumeId: number): Observable<void> {
    return this.http.put<void>(`${RESUME_API}/${resumeId}/view-count`, {});
  }
}

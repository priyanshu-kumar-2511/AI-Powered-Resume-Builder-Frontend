import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateResumeRequest, Resume, UpdateResumeRequest } from '../../../shared/models/models';

const API = 'http://localhost:8080/api/v1/resumes';

@Injectable({ providedIn: 'root' })
export class ResumeApiService {
  private http = inject(HttpClient);

  create(payload: CreateResumeRequest): Observable<Resume> {
    return this.http.post<Resume>(API, payload);
  }

  getById(resumeId: number): Observable<Resume> {
    return this.http.get<Resume>(`${API}/${resumeId}`);
  }

  getByUser(userId: number): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${API}/user/${userId}`);
  }

  getPublic(): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${API}/public`);
  }

  update(resumeId: number, payload: UpdateResumeRequest): Observable<Resume> {
    return this.http.put<Resume>(`${API}/${resumeId}`, payload);
  }

  delete(resumeId: number): Observable<void> {
    return this.http.delete<void>(`${API}/${resumeId}`);
  }

  duplicate(resumeId: number): Observable<Resume> {
    return this.http.post<Resume>(`${API}/${resumeId}/duplicate`, {});
  }

  publish(resumeId: number): Observable<Resume> {
    return this.http.put<Resume>(`${API}/${resumeId}/publish`, {});
  }

  unpublish(resumeId: number): Observable<Resume> {
    return this.http.put<Resume>(`${API}/${resumeId}/unpublish`, {});
  }

  incrementViewCount(resumeId: number): Observable<void> {
    return this.http.put<void>(`${API}/${resumeId}/view-count`, {});
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumeSection, AddSectionRequest, UpdateSectionRequest } from '../../../shared/models/models';

const API = 'http://localhost:8080/api/v1/sections';

@Injectable({ providedIn: 'root' })
export class SectionApiService {
  private http = inject(HttpClient);

  addSection(payload: AddSectionRequest): Observable<ResumeSection> {
    return this.http.post<ResumeSection>(API, payload);
  }

  getSections(resumeId: number): Observable<ResumeSection[]> {
    return this.http.get<ResumeSection[]>(`${API}/resume/${resumeId}`);
  }

  getSectionById(sectionId: number): Observable<ResumeSection> {
    return this.http.get<ResumeSection>(`${API}/${sectionId}`);
  }

  updateSection(sectionId: number, payload: UpdateSectionRequest): Observable<ResumeSection> {
    return this.http.put<ResumeSection>(`${API}/${sectionId}`, payload);
  }

  deleteSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${API}/${sectionId}`);
  }

  reorder(resumeId: number, sectionIds: number[]): Observable<void> {
    return this.http.put<void>(`${API}/resume/${resumeId}/reorder`, sectionIds);
  }

  toggleVisibility(sectionId: number): Observable<ResumeSection> {
    return this.http.put<ResumeSection>(`${API}/${sectionId}/toggle-visibility`, {});
  }

  bulkUpdate(sections: ResumeSection[]): Observable<ResumeSection[]> {
    return this.http.put<ResumeSection[]>(`${API}/bulk-update`, sections);
  }
}

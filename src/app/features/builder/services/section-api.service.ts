import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumeSection, AddSectionRequest, UpdateSectionRequest } from '../../../shared/models/models';
import { SECTION_API } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class SectionApiService {
  private http = inject(HttpClient);

  addSection(payload: AddSectionRequest): Observable<ResumeSection> {
    return this.http.post<ResumeSection>(SECTION_API, payload);
  }

  getSections(resumeId: number): Observable<ResumeSection[]> {
    return this.http.get<ResumeSection[]>(`${SECTION_API}/resume/${resumeId}`);
  }

  getSectionById(sectionId: number): Observable<ResumeSection> {
    return this.http.get<ResumeSection>(`${SECTION_API}/${sectionId}`);
  }

  updateSection(sectionId: number, payload: UpdateSectionRequest): Observable<ResumeSection> {
    return this.http.put<ResumeSection>(`${SECTION_API}/${sectionId}`, payload);
  }

  deleteSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${SECTION_API}/${sectionId}`);
  }

  reorder(resumeId: number, sectionIds: number[]): Observable<void> {
    return this.http.put<void>(`${SECTION_API}/resume/${resumeId}/reorder`, sectionIds);
  }

  toggleVisibility(sectionId: number): Observable<ResumeSection> {
    return this.http.put<ResumeSection>(`${SECTION_API}/${sectionId}/toggle-visibility`, {});
  }

  bulkUpdate(sections: ResumeSection[]): Observable<ResumeSection[]> {
    return this.http.put<ResumeSection[]>(`${SECTION_API}/bulk-update`, sections);
  }
}

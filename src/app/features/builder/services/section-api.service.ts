import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumeSection, AddSectionRequest, UpdateSectionRequest } from '../../../shared/models/models';
import { SECTION_API } from '../../../core/config/api.config';

/**
 * Service for communicating with the backend Section Service.
 * Manages CRUD operations, ordering, and visibility of individual resume sections.
 */
@Injectable({ providedIn: 'root' })
export class SectionApiService {
  private http = inject(HttpClient);

  /**
   * Adds a new section to a specific resume.
   * @param payload Section data
   * @returns Observable with the created Section
   */
  addSection(payload: AddSectionRequest): Observable<ResumeSection> {
    return this.http.post<ResumeSection>(SECTION_API, payload);
  }

  /**
   * Fetches all sections associated with a specific resume.
   * @param resumeId The ID of the parent resume
   * @returns Observable of an array of Sections
   */
  getSections(resumeId: number): Observable<ResumeSection[]> {
    return this.http.get<ResumeSection[]>(`${SECTION_API}/resume/${resumeId}`);
  }

  /**
   * Fetches a specific section by its ID.
   * @param sectionId The ID of the section
   * @returns Observable with the Section data
   */
  getSectionById(sectionId: number): Observable<ResumeSection> {
    return this.http.get<ResumeSection>(`${SECTION_API}/${sectionId}`);
  }

  /**
   * Updates the content or metadata of an existing section.
   * @param sectionId The ID of the section to update
   * @param payload The updated section data
   * @returns Observable with the updated Section
   */
  updateSection(sectionId: number, payload: UpdateSectionRequest): Observable<ResumeSection> {
    return this.http.put<ResumeSection>(`${SECTION_API}/${sectionId}`, payload);
  }

  /**
   * Permanently deletes a section.
   * @param sectionId The ID of the section to delete
   * @returns Observable that completes on successful deletion
   */
  deleteSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${SECTION_API}/${sectionId}`);
  }

  /**
   * Updates the display order of sections within a resume.
   * @param resumeId The ID of the parent resume
   * @param sectionIds An array of section IDs in their new order
   * @returns Observable that completes on success
   */
  reorder(resumeId: number, sectionIds: number[]): Observable<void> {
    return this.http.put<void>(`${SECTION_API}/resume/${resumeId}/reorder`, sectionIds);
  }

  /**
   * Toggles the visibility state (hidden/visible) of a specific section.
   * @param sectionId The ID of the section
   * @returns Observable with the updated Section
   */
  toggleVisibility(sectionId: number): Observable<ResumeSection> {
    return this.http.put<ResumeSection>(`${SECTION_API}/${sectionId}/toggle-visibility`, {});
  }

  /**
   * Updates multiple sections in a single API call.
   * @param sections An array of sections with updated data
   * @returns Observable of the updated Sections array
   */
  bulkUpdate(sections: ResumeSection[]): Observable<ResumeSection[]> {
    return this.http.put<ResumeSection[]>(`${SECTION_API}/bulk-update`, sections);
  }
}

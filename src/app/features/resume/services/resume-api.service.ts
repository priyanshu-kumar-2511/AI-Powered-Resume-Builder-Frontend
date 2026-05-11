import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateResumeRequest, Resume, UpdateResumeRequest } from '../../../shared/models/models';
import { RESUME_API } from '../../../core/config/api.config';

/**
 * Service for communicating with the backend Resume Service.
 * Provides endpoints to manage the lifecycle of a resume.
 */
@Injectable({ providedIn: 'root' })
export class ResumeApiService {
  private http = inject(HttpClient);

  /**
   * Creates a new resume based on the provided initial payload.
   * @param payload Resume creation data
   * @returns Observable with the newly created Resume
   */
  create(payload: CreateResumeRequest): Observable<Resume> {
    return this.http.post<Resume>(RESUME_API, payload);
  }

  /**
   * Fetches a specific resume by its ID.
   * @param resumeId The ID of the resume
   * @returns Observable with the Resume data
   */
  getById(resumeId: number): Observable<Resume> {
    return this.http.get<Resume>(`${RESUME_API}/${resumeId}`);
  }

  /**
   * Fetches all resumes belonging to a specific user.
   * @param userId The ID of the user
   * @returns Observable of an array of Resumes
   */
  getByUser(userId: number): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${RESUME_API}/user/${userId}`);
  }

  /**
   * Fetches all public resumes available in the gallery.
   * @returns Observable of an array of public Resumes
   */
  getPublic(): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${RESUME_API}/public`);
  }

  /**
   * Updates an existing resume's top-level metadata.
   * @param resumeId The ID of the resume to update
   * @param payload Updated resume data
   * @returns Observable with the updated Resume
   */
  update(resumeId: number, payload: UpdateResumeRequest): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}`, payload);
  }

  /**
   * Permanently deletes a resume.
   * @param resumeId The ID of the resume to delete
   * @returns Observable that completes on successful deletion
   */
  delete(resumeId: number): Observable<void> {
    return this.http.delete<void>(`${RESUME_API}/${resumeId}`);
  }

  /**
   * Duplicates an existing resume, creating a new variant for the user.
   * @param resumeId The ID of the resume to duplicate
   * @returns Observable with the newly duplicated Resume
   */
  duplicate(resumeId: number): Observable<Resume> {
    return this.http.post<Resume>(`${RESUME_API}/${resumeId}/duplicate`, {});
  }

  /**
   * Publishes a resume to the public gallery, making it viewable by others.
   * @param resumeId The ID of the resume to publish
   * @returns Observable with the updated Resume
   */
  publish(resumeId: number): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}/publish`, {});
  }

  /**
   * Removes a resume from the public gallery, setting it to private.
   * @param resumeId The ID of the resume to unpublish
   * @returns Observable with the updated Resume
   */
  unpublish(resumeId: number): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}/unpublish`, {});
  }

  /**
   * Increments the view count for a public resume.
   * @param resumeId The ID of the resume
   * @returns Observable that completes on success
   */
  incrementViewCount(resumeId: number): Observable<void> {
    return this.http.put<void>(`${RESUME_API}/${resumeId}/view-count`, {});
  }

  /**
   * Updates the ATS score of a specific resume.
   * @param resumeId The ID of the resume
   * @param atsScore The new ATS score
   * @returns Observable with the updated Resume
   */
  updateAtsScore(resumeId: number, atsScore: number): Observable<Resume> {
    return this.http.put<Resume>(`${RESUME_API}/${resumeId}/ats-score`, { atsScore });
  }
}

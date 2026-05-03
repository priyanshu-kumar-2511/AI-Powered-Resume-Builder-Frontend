import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { Resume } from '../../../shared/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { ResumeApiService } from './resume-api.service';

/**
 * State management service for handling the user's list of resumes.
 * Uses a BehaviorSubject to broadcast the active list of resumes to components
 * without requiring repeated API calls.
 */
@Injectable({ providedIn: 'root' })
export class ResumeStateService {
  private auth = inject(AuthService);
  private api = inject(ResumeApiService);

  private resumesSubject = new BehaviorSubject<Resume[]>([]);

  readonly resumes$ = this.resumesSubject.asObservable();

  /**
   * Retrieves a synchronous snapshot of the currently loaded resumes.
   */
  get snapshot(): Resume[] {
    return this.resumesSubject.value;
  }

  /**
   * Loads the resumes from the backend for the currently authenticated user.
   * Updates the local state and broadcasts to subscribers.
   * @returns Observable of the loaded Resumes
   */
  load(): Observable<Resume[]> {
    const userId = this.auth.getCurrentUserId();
    if (userId === null) {
      return throwError(() => new Error('Unable to resolve the current user for resume requests.'));
    }

    return this.api.getByUser(userId).pipe(
      tap((resumes) => this.resumesSubject.next(this.sortResumes(resumes)))
    );
  }

  /**
   * Manually overwrites the entire list of resumes in state.
   */
  set(resumes: Resume[]): void {
    this.resumesSubject.next(this.sortResumes(resumes));
  }

  /**
   * Adds a newly created resume to the top of the state list.
   */
  add(resume: Resume): void {
    this.resumesSubject.next(this.sortResumes([resume, ...this.resumesSubject.value]));
  }

  /**
   * Updates an existing resume in the state. If it doesn't exist, it is added.
   */
  update(resume: Resume): void {
    const exists = this.resumesSubject.value.some((item) => item.resumeId === resume.resumeId);
    const nextValue = exists
      ? this.resumesSubject.value.map((item) => item.resumeId === resume.resumeId ? resume : item)
      : [resume, ...this.resumesSubject.value];

    this.resumesSubject.next(this.sortResumes(nextValue));
  }

  /**
   * Removes a resume from the local state.
   */
  remove(resumeId: number): void {
    this.resumesSubject.next(this.resumesSubject.value.filter((item) => item.resumeId !== resumeId));
  }

  private sortResumes(resumes: Resume[]): Resume[] {
    return [...resumes].sort((left, right) => (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    ));
  }
}

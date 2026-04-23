import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { Resume } from '../../../shared/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { ResumeApiService } from './resume-api.service';

@Injectable({ providedIn: 'root' })
export class ResumeStateService {
  private auth = inject(AuthService);
  private api = inject(ResumeApiService);

  private resumesSubject = new BehaviorSubject<Resume[]>([]);

  readonly resumes$ = this.resumesSubject.asObservable();

  get snapshot(): Resume[] {
    return this.resumesSubject.value;
  }

  load(): Observable<Resume[]> {
    const userId = this.auth.getCurrentUserId();
    if (userId === null) {
      return throwError(() => new Error('Unable to resolve the current user for resume requests.'));
    }

    return this.api.getByUser(userId).pipe(
      tap((resumes) => this.resumesSubject.next(this.sortResumes(resumes)))
    );
  }

  set(resumes: Resume[]): void {
    this.resumesSubject.next(this.sortResumes(resumes));
  }

  add(resume: Resume): void {
    this.resumesSubject.next(this.sortResumes([resume, ...this.resumesSubject.value]));
  }

  update(resume: Resume): void {
    const exists = this.resumesSubject.value.some((item) => item.resumeId === resume.resumeId);
    const nextValue = exists
      ? this.resumesSubject.value.map((item) => item.resumeId === resume.resumeId ? resume : item)
      : [resume, ...this.resumesSubject.value];

    this.resumesSubject.next(this.sortResumes(nextValue));
  }

  remove(resumeId: number): void {
    this.resumesSubject.next(this.resumesSubject.value.filter((item) => item.resumeId !== resumeId));
  }

  private sortResumes(resumes: Resume[]): Resume[] {
    return [...resumes].sort((left, right) => (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    ));
  }
}

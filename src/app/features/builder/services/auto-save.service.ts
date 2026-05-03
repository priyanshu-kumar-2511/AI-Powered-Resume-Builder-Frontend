import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';
import { ResumeSection, UpdateSectionRequest } from '../../../shared/models/models';
import { SectionApiService } from './section-api.service';
import { BuilderStateService } from './builder-state.service';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Service that handles background auto-saving of resume sections.
 * Implements a debounced save queue to prevent API spam while a user types.
 */
@Injectable({ providedIn: 'root' })
export class AutoSaveService {
  private sectionApi = inject(SectionApiService);
  private builderState = inject(BuilderStateService);

  private saveQueue$ = new Subject<{ sectionId: number; payload: UpdateSectionRequest }>();
  private statusSubject = new BehaviorSubject<SaveStatus>('idle');
  private lastSavedSubject = new BehaviorSubject<Date | null>(null);

  readonly saveStatus$ = this.statusSubject.asObservable();
  readonly lastSaved$  = this.lastSavedSubject.asObservable();

  /**
   * Helper getter that generates a user-friendly UI string representing the current save status.
   */
  get statusLabel(): string {
    const status = this.statusSubject.value;
    const lastSaved = this.lastSavedSubject.value;

    if (status === 'saving') return 'Saving...';
    if (status === 'error')  return 'Save failed';
    if (status === 'saved' && lastSaved) {
      return `Saved ✓ ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Autosave on';
  }

  constructor() {
    this.saveQueue$.pipe(
      tap(() => this.statusSubject.next('saving')),
      debounceTime(1000),
      switchMap(({ sectionId, payload }) =>
        this.sectionApi.updateSection(sectionId, payload).pipe(
          catchError(() => {
            this.statusSubject.next('error');
            return EMPTY;
          })
        )
      )
    ).subscribe(updated => {
      this.builderState.updateSection(updated);
      this.statusSubject.next('saved');
      this.lastSavedSubject.next(new Date());
    });
  }

  /**
   * Pushes a section update into the auto-save queue.
   * If multiple saves are queued within 1 second, only the final one is executed (debounced).
   * @param sectionId The ID of the section to update
   * @param payload The new section content
   */
  queueSave(sectionId: number, payload: UpdateSectionRequest): void {
    this.saveQueue$.next({ sectionId, payload });
  }

  /**
   * Resets the auto-save indicator back to 'idle'.
   */
  resetStatus(): void {
    this.statusSubject.next('idle');
  }
}

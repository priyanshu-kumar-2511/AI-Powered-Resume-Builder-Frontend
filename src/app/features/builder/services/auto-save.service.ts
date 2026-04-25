import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';
import { ResumeSection, UpdateSectionRequest } from '../../../shared/models/models';
import { SectionApiService } from './section-api.service';
import { BuilderStateService } from './builder-state.service';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

@Injectable({ providedIn: 'root' })
export class AutoSaveService {
  private sectionApi = inject(SectionApiService);
  private builderState = inject(BuilderStateService);

  private saveQueue$ = new Subject<{ sectionId: number; payload: UpdateSectionRequest }>();
  private statusSubject = new BehaviorSubject<SaveStatus>('idle');
  private lastSavedSubject = new BehaviorSubject<Date | null>(null);

  readonly saveStatus$ = this.statusSubject.asObservable();
  readonly lastSaved$  = this.lastSavedSubject.asObservable();

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

  queueSave(sectionId: number, payload: UpdateSectionRequest): void {
    this.saveQueue$.next({ sectionId, payload });
  }

  resetStatus(): void {
    this.statusSubject.next('idle');
  }
}

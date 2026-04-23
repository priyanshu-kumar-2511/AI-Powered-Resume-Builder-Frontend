import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs';
import { Resume, ResumeStatus, UpdateResumeRequest } from '../../../shared/models/models';
import { ResumeApiService } from '../services/resume-api.service';
import { ResumeStateService } from '../services/resume-state.service';

type ResumeSettingsForm = FormGroup<{
  title: FormControl<string>;
  targetJobTitle: FormControl<string>;
  language: FormControl<string>;
  status: FormControl<ResumeStatus>;
}>;

@Component({
  selector: 'app-resume-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resume-settings.component.html'
})
export class ResumeSettingsComponent implements OnInit, OnDestroy {
  private api = inject(ResumeApiService);
  private state = inject(ResumeStateService);
  private destroy$ = new Subject<void>();

  @Input({ required: true }) resumeId!: number;
  @Output() resumeLoaded = new EventEmitter<Resume>();
  @Output() resumeChange = new EventEmitter<Resume>();

  readonly languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'hi', label: 'Hindi' }
  ];

  form: ResumeSettingsForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    targetJobTitle: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    language: new FormControl('en', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<ResumeStatus>('DRAFT', { nonNullable: true, validators: [Validators.required] })
  });

  loading = true;
  error = '';
  saveState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  lastSavedAt: Date | null = null;

  ngOnInit(): void {
    this.loadResume();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get saveLabel(): string {
    if (this.saveState === 'saving') {
      return 'Saving changes...';
    }

    if (this.saveState === 'saved' && this.lastSavedAt) {
      return `Saved at ${this.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (this.saveState === 'error') {
      return 'Unable to save changes';
    }

    return 'Autosave is on';
  }

  private loadResume(): void {
    this.loading = true;
    this.error = '';

    this.api.getById(this.resumeId).subscribe({
      next: (resume) => {
        this.form.patchValue({
          title: resume.title,
          targetJobTitle: resume.targetJobTitle || '',
          language: resume.language || 'en',
          status: resume.status
        }, { emitEvent: false });

        this.loading = false;
        this.saveState = 'idle';
        this.state.update(resume);
        this.resumeLoaded.emit(resume);
        this.resumeChange.emit(resume);
      },
      error: () => {
        this.loading = false;
        this.error = 'We could not load this resume. Please refresh and try again.';
      }
    });
  }

  private setupAutoSave(): void {
    this.form.valueChanges.pipe(
      debounceTime(500),
      filter(() => !this.loading && this.form.valid),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      tap(() => {
        this.saveState = 'saving';
        this.error = '';
      }),
      switchMap(() => this.api.update(this.resumeId, this.buildPayload()).pipe(
        catchError(() => {
          this.saveState = 'error';
          this.error = 'Changes were not saved. Please try again.';
          return EMPTY;
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resume) => {
        this.saveState = 'saved';
        this.lastSavedAt = new Date();
        this.state.update(resume);
        this.resumeChange.emit(resume);
      }
    });
  }

  private buildPayload(): UpdateResumeRequest {
    return {
      title: this.form.controls.title.value.trim(),
      targetJobTitle: this.form.controls.targetJobTitle.value.trim(),
      language: this.form.controls.language.value,
      status: this.form.controls.status.value
    };
  }
}

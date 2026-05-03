import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { Resume, UserProfileResponse } from '../../../shared/models/models';
import { BuilderStateService } from '../services/builder-state.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';

type ContactFormValue = {
  fullName: string;
  email: string;
  mobileNumber: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  jobTitle: string;
};

@Component({
  selector: 'app-contact-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="contact-editor">
      <div class="editor-top-row">
        <span class="save-hint">{{ savedMessage }}</span>
      </div>

      <form class="contact-form" [formGroup]="form">
        <div class="field-group">
          <label class="field-label">Full Name</label>
          <input class="field-input" formControlName="fullName" />
        </div>

        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Email</label>
            <input class="field-input" formControlName="email" />
          </div>
          <div class="field-group">
            <label class="field-label">Phone</label>
            <input class="field-input" formControlName="mobileNumber" />
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Address / Location</label>
          <input class="field-input" formControlName="location" />
        </div>

        <div class="field-group">
          <label class="field-label">Job Title</label>
          <input class="field-input" formControlName="jobTitle" />
        </div>

        <div class="field-group">
          <label class="field-label">LinkedIn</label>
          <input class="field-input" formControlName="linkedin" />
        </div>

        <div class="field-group">
          <label class="field-label">GitHub</label>
          <input class="field-input" formControlName="github" />
        </div>

        <div class="field-group">
          <label class="field-label">Website</label>
          <input class="field-input" formControlName="website" />
        </div>
      </form>

      <p class="editor-note">Contact fields are used directly in the live preview. Location and social links are stored for this resume in your browser.</p>
    </div>

    <style>
      .contact-editor { display: flex; flex-direction: column; gap: 14px; }
      .editor-top-row { display: flex; justify-content: space-between; align-items: center; }
      .save-hint { font-size: 0.75rem; color: var(--text-muted); }
      .contact-form { display: flex; flex-direction: column; gap: 12px; }
      .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .field-group { display: flex; flex-direction: column; gap: 5px; }
      .field-label { font-size: 0.78rem; font-weight: 500; color: var(--text-secondary); }
      .field-input {
        padding: 9px 10px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-primary);
        font-size: 0.88rem;
        width: 100%;
        box-sizing: border-box;
      }
      .field-input:focus { border-color: var(--teal); outline: none; }
      .editor-note { margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.55; }
    </style>
  `
})
export class ContactEditorComponent implements OnChanges {
  @Input({ required: true }) resumeId!: number;
  @Output() saved = new EventEmitter<void>();

  private builderState = inject(BuilderStateService);
  private resumeApi = inject(ResumeApiService);
  private destroy$ = new Subject<void>();

  savedMessage = 'Autosave on';

  form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    mobileNumber: new FormControl('', { nonNullable: true }),
    location: new FormControl('', { nonNullable: true }),
    linkedin: new FormControl('', { nonNullable: true }),
    github: new FormControl('', { nonNullable: true }),
    website: new FormControl('', { nonNullable: true }),
    jobTitle: new FormControl('', { nonNullable: true })
  });

  ngOnChanges(): void {
    this.destroy$.next();

    const profile = this.builderState.userProfileSnapshot;
    const resume = this.builderState.resumeSnapshot;

    this.form.setValue({
      fullName: profile?.fullName || '',
      email: profile?.email || '',
      mobileNumber: profile?.mobileNumber || '',
      location: profile?.location || '',
      linkedin: profile?.linkedin || '',
      github: profile?.github || '',
      website: profile?.website || '',
      jobTitle: resume?.targetJobTitle || ''
    }, { emitEvent: false });

    this.form.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      this.applyChanges(value as ContactFormValue);
    });
  }

  private applyChanges(value: ContactFormValue): void {
    const currentProfile = this.builderState.userProfileSnapshot;
    const currentResume = this.builderState.resumeSnapshot;

    const mergedProfile: UserProfileResponse = {
      userId: currentProfile?.userId,
      username: currentProfile?.username || '',
      fullName: value.fullName,
      email: value.email,
      mobileNumber: value.mobileNumber,
      location: value.location,
      linkedin: value.linkedin,
      github: value.github,
      website: value.website,
      age: currentProfile?.age || 0,
      subscriptionPlan: currentProfile?.subscriptionPlan || 'FREE',
      roles: currentProfile?.roles || [],
      isActive: currentProfile?.isActive ?? true
    };

    this.builderState.setUserProfile(mergedProfile);
    localStorage.setItem(this.storageKey, JSON.stringify({
      fullName: value.fullName,
      email: value.email,
      mobileNumber: value.mobileNumber,
      location: value.location,
      linkedin: value.linkedin,
      github: value.github,
      website: value.website
    }));

    if (currentResume && currentResume.targetJobTitle !== value.jobTitle) {
      const updatedResume: Resume = { ...currentResume, targetJobTitle: value.jobTitle };
      this.builderState.setResume(updatedResume);
      this.resumeApi.update(this.resumeId, { targetJobTitle: value.jobTitle }).subscribe({
        next: () => undefined,
        error: () => undefined
      });
    }

    this.savedMessage = 'Saved to preview';
    this.saved.emit();
  }

  private get storageKey(): string {
    return `resumeai_contact_overrides_${this.resumeId}`;
  }
}

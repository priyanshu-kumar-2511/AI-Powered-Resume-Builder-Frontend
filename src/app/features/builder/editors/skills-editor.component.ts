import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection } from '../../../shared/models/models';

@Component({
  selector: 'app-skills-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="skills-editor">
      <div class="editor-top-row">
        <span class="save-hint" [class.saving]="saving" [class.error]="saveError">
          {{ saving ? 'Saving...' : saveError ? 'Save failed' : 'Autosave on' }}
        </span>
        <span class="skill-count">{{ skills.length }} skill{{ skills.length !== 1 ? 's' : '' }}</span>
      </div>

      <div class="chip-area">
        @for (skill of skills; track i; let i = $index) {
          <span class="skill-chip">
            {{ skill }}
            <button type="button" class="chip-remove" (click)="removeSkill(i)" title="Remove">✕</button>
          </span>
        }
        @if (!skills.length) {
          <span class="chip-placeholder">No skills added yet. Type below to add.</span>
        }
      </div>

      <div class="input-row">
        <input
          class="skill-input"
          [formControl]="inputControl"
          placeholder="Type a skill and press Enter or comma…"
          (keydown.enter)="$event.preventDefault(); addFromInput()"
          (keydown.comma)="$event.preventDefault(); addFromInput()" />
        <button type="button" class="btn btn-ghost btn-sm" (click)="addFromInput()">Add</button>
      </div>

      @if (saveError) {
        <div class="alert alert-error" style="margin-top:8px;">{{ saveError }}</div>
      }
    </div>

    <style>
    .skills-editor { display: flex; flex-direction: column; gap: 14px; }
    .editor-top-row { display: flex; justify-content: space-between; align-items: center; }
    .save-hint { font-size: 0.75rem; color: var(--text-muted); }
    .save-hint.saving { color: var(--teal); }
    .save-hint.error  { color: #ef4444; }
    .skill-count { font-size: 0.75rem; color: var(--text-muted); }

    .chip-area {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 48px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-surface);
      align-content: flex-start;
    }

    .chip-placeholder {
      font-size: 0.82rem;
      color: var(--text-muted);
      align-self: center;
    }

    .skill-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0,212,180,0.1);
      border: 1px solid rgba(0,212,180,0.25);
      color: var(--teal);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 0.82rem;
      font-weight: 500;
    }

    .chip-remove {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--teal);
      font-size: 0.7rem;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
    }
    .chip-remove:hover { opacity: 1; }

    .input-row {
      display: flex;
      gap: 8px;
    }

    .skill-input {
      flex: 1;
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.88rem;
    }
    .skill-input:focus { border-color: var(--teal); outline: none; }
    </style>
  `
})
export class SkillsEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() saved = new EventEmitter<ResumeSection>();

  private sectionApi = inject(SectionApiService);
  private destroy$   = new Subject<void>();
  private save$      = new Subject<string[]>();

  skills: string[]    = [];
  inputControl        = new FormControl('', { nonNullable: true });
  saving              = false;
  saveError           = '';

  ngOnChanges(): void {
    this.destroy$.next();
    this.saveError = '';

    try {
      const parsed = JSON.parse(this.section.content || '[]');
      this.skills = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.skills = [];
    }

    this.save$.pipe(
      debounceTime(600),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(skills => {
        this.saving = true;
        this.saveError = '';
        return this.sectionApi.updateSection(this.section.sectionId, {
          content: JSON.stringify(skills)
        }).pipe(
          catchError(() => {
            this.saving = false;
            this.saveError = 'Save failed.';
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      this.saving = false;
      this.saved.emit(updated);
    });
  }

  addFromInput(): void {
    const raw = this.inputControl.value.trim().replace(/,$/, '').trim();
    if (!raw) return;

    const newSkills = raw.split(',')
      .map(s => s.trim())
      .filter(s => s && !this.skills.includes(s));

    if (!newSkills.length) {
      this.inputControl.reset();
      return;
    }

    this.skills = [...this.skills, ...newSkills];
    this.inputControl.reset();
    this.save$.next(this.skills);
  }

  removeSkill(index: number): void {
    this.skills = this.skills.filter((_, i) => i !== index);
    this.save$.next(this.skills);
  }
}

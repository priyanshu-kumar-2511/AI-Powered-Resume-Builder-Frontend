import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection } from '../../../shared/models/models';

interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-education-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="edu-editor">
      <div class="editor-top-row">
        <span class="save-hint" [class.saving]="saving">{{ saving ? 'Saving...' : saveError ? 'Save failed' : 'Autosave on' }}</span>
        <button type="button" class="btn btn-ghost btn-sm" (click)="addEntry()">+ Add Education</button>
      </div>

      <!-- Section Styling (Font Size) -->
      <div class="section-styling">
        <label class="style-label">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
          Section Font Size:
        </label>
        <input type="range" min="8" max="24" [formControl]="fontSizeControl" class="style-slider">
        <span class="style-val">{{ fontSizeControl.value }}px</span>
      </div>

      @if (!form.controls.length) {
        <div class="empty-hint">No education entries yet.</div>
      }

      @for (entryCtrl of form.controls; track i; let i = $index) {
        <div class="edu-card" [formGroup]="asGroup(entryCtrl)">
          <div class="card-header">
            <span class="card-num">Entry {{ i + 1 }}</span>
            <button type="button" class="remove-btn" (click)="remove(i)">Remove</button>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Institution *</label>
              <input class="field-input" formControlName="institution" placeholder="e.g. MIT" />
            </div>
            <div class="field-group">
              <label class="field-label">Degree</label>
              <input class="field-input" formControlName="degree" placeholder="e.g. Bachelor of Science" />
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Field of Study</label>
              <input class="field-input" formControlName="fieldOfStudy" placeholder="e.g. Computer Science" />
            </div>
            <div class="field-group">
              <label class="field-label">Grade / GPA</label>
              <input class="field-input" formControlName="grade" placeholder="e.g. 3.9 / 4.0" />
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Start Year</label>
              <input class="field-input" formControlName="startYear" placeholder="e.g. 2018" />
            </div>
            <div class="field-group">
              <label class="field-label">End Year</label>
              <input class="field-input" formControlName="endYear" placeholder="e.g. 2022" 
                     [class.disabled-input]="asGroup(entryCtrl).get('isCurrent')?.value" />
            </div>
          </div>

          <label class="current-chk">
            <input type="checkbox" formControlName="isCurrent" />
            Currently Studying / Present
          </label>
        </div>
      }
    </div>

    <style>
    .edu-editor { display: flex; flex-direction: column; gap: 16px; }
    .editor-top-row { display: flex; justify-content: space-between; align-items: center; }

    /* Section Styling */
    .section-styling {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: rgba(255,255,255,0.03);
      border: 1px solid var(--border); border-radius: 10px;
      margin-bottom: 4px;
    }
    .style-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);
    }
    .style-slider {
      flex: 1; height: 4px; border-radius: 2px;
      background: rgba(255,255,255,0.1); outline: none;
      -webkit-appearance: none; cursor: pointer;
    }
    .style-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      border-radius: 50%; background: var(--teal);
      box-shadow: 0 0 10px rgba(0,212,180,0.4);
    }
    .style-val { font-size: 0.75rem; font-weight: 700; color: var(--teal); min-width: 35px; }

    .save-hint { font-size: 0.75rem; color: var(--text-muted); }
    .save-hint.saving { color: var(--teal); }
    .empty-hint { font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 32px; border: 1px dashed var(--border); border-radius: 10px; }
    .edu-card { border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: var(--bg-surface); }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-num { font-size: 0.8rem; font-weight: 600; color: var(--teal); }
    .remove-btn { font-size: 0.75rem; color: #ef4444; background: none; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 3px 10px; cursor: pointer; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-group { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 0.78rem; font-weight: 500; color: var(--text-secondary); }
    .field-input { padding: 8px 10px; border-radius: 7px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 0.88rem; width: 100%; box-sizing: border-box; }
    .field-input:focus { border-color: var(--teal); outline: none; }
    .current-chk { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; margin-top: -4px; }
    .disabled-input { opacity: 0.5; background: rgba(255,255,255,0.05); pointer-events: none; }
    </style>
  `
})
export class EducationEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() saved = new EventEmitter<ResumeSection>();

  private sectionApi = inject(SectionApiService);
  private destroy$   = new Subject<void>();

  form = new FormArray<FormGroup>([]);
  fontSizeControl = new FormControl(12, { nonNullable: true });
  saving = false;
  saveError = '';

  ngOnChanges(): void {
    this.destroy$.next();
    let data: any = null;
    try { data = JSON.parse(this.section.content || '[]'); } catch { data = []; }
    
    let items: EducationEntry[] = [];
    let fontSize = 12;

    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      items = data.items || [];
      fontSize = data.fontSize || 12;
    }

    this.fontSizeControl.setValue(fontSize, { emitEvent: false });
    this.form = new FormArray(items.map(e => this.build(e)));

    const update$ = new Subject<void>();
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());
    this.fontSizeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());

    update$.pipe(
      debounceTime(800),
      switchMap(() => {
        this.saving = true; this.saveError = '';
        const payload = { items: this.form.value, fontSize: this.fontSizeControl.value };
        return this.sectionApi.updateSection(this.section.sectionId, { content: JSON.stringify(payload) }).pipe(
          catchError(() => { this.saving = false; this.saveError = 'Save failed.'; return EMPTY; })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(updated => { this.saving = false; this.saved.emit(updated); });
  }

  addEntry(): void {
    this.form.push(this.build({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '', isCurrent: false }));
  }

  remove(i: number): void { this.form.removeAt(i); }

  asGroup(c: AbstractControl): FormGroup { return c as FormGroup; }

  private build(e: EducationEntry): FormGroup {
    return new FormGroup({
      institution:  new FormControl(e.institution  || '', { nonNullable: true, validators: [Validators.required] }),
      degree:       new FormControl(e.degree       || '', { nonNullable: true }),
      fieldOfStudy: new FormControl(e.fieldOfStudy || '', { nonNullable: true }),
      startYear:    new FormControl(e.startYear    || '', { nonNullable: true }),
      endYear:      new FormControl(e.endYear      || '', { nonNullable: true }),
      grade:        new FormControl(e.grade        || '', { nonNullable: true }),
      isCurrent:    new FormControl(e.isCurrent    || false, { nonNullable: true })
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection } from '../../../shared/models/models';

@Component({
  selector: 'app-summary-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="summary-editor">
      <label class="field-label">Professional Summary</label>
      <textarea
        class="summary-textarea"
        [formControl]="textControl"
        placeholder="Write a concise professional summary that highlights your key skills and experience..."
        rows="6"></textarea>

      <div class="editor-footer">
        <span class="char-count" [class.over]="textControl.value.length > 600">
          {{ textControl.value.length }} / 600
        </span>
        <span class="save-hint" [class.saving]="saving" [class.error]="saveError">
          {{ saveHint }}
        </span>
      </div>

      @if (saveError) {
        <div class="alert alert-error" style="margin-top:8px">{{ saveError }}</div>
      }
    </div>

    <style>
    .summary-editor { display: flex; flex-direction: column; gap: 10px; }
    .field-label { font-size: 0.82rem; font-weight: 500; color: var(--text-secondary); }
    .summary-textarea {
      width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-surface); color: var(--text-primary); font-size: 0.9rem;
      resize: vertical; line-height: 1.6; box-sizing: border-box; font-family: inherit;
    }
    .summary-textarea:focus { border-color: var(--teal); outline: none; }
    .editor-footer { display: flex; justify-content: space-between; align-items: center; }
    .char-count { font-size: 0.75rem; color: var(--text-muted); }
    .char-count.over { color: #ef4444; }
    .save-hint { font-size: 0.75rem; color: var(--text-muted); }
    .save-hint.saving { color: var(--teal); }
    .save-hint.error  { color: #ef4444; }
    </style>
  `
})
export class SummaryEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() saved = new EventEmitter<ResumeSection>();

  private sectionApi = inject(SectionApiService);
  private destroy$   = new Subject<void>();

  textControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(600)] });
  saving    = false;
  saveError = '';

  get saveHint(): string {
    if (this.saving)   return 'Saving...';
    if (this.saveError) return 'Save failed';
    return 'Autosave on';
  }

  ngOnChanges(): void {
    this.destroy$.next();

    let parsed: any;
    try { parsed = JSON.parse(this.section.content || '{}'); } catch { parsed = {}; }
    this.textControl.setValue(parsed.text || '', { emitEvent: false });
    this.saveError = '';

    this.textControl.valueChanges.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(text => {
        this.saving = true;
        this.saveError = '';
        const content = JSON.stringify({ text });
        return this.sectionApi.updateSection(this.section.sectionId, { content }).pipe(
          catchError(() => { this.saving = false; this.saveError = 'Save failed.'; return EMPTY; })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      this.saving = false;
      this.saved.emit(updated);
    });
  }
}

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
      <!-- Section Styling (Font Size) -->
      <div class="section-styling">
        <label class="style-label">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
          Section Font Size:
        </label>
        <input type="range" min="8" max="24" [formControl]="fontSizeControl" class="style-slider">
        <span class="style-val">{{ fontSizeControl.value }}px</span>
      </div>

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
  fontSizeControl = new FormControl(12, { nonNullable: true });
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
    this.fontSizeControl.setValue(parsed.fontSize || 12, { emitEvent: false });
    this.saveError = '';

    const update$ = new Subject<void>();
    this.textControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());
    this.fontSizeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());

    update$.pipe(
      debounceTime(800),
      switchMap(() => {
        this.saving = true;
        this.saveError = '';
        const content = JSON.stringify({ 
          text: this.textControl.value, 
          fontSize: this.fontSizeControl.value 
        });
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

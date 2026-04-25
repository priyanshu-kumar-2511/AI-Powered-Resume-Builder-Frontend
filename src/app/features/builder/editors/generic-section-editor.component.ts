import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection } from '../../../shared/models/models';

@Component({
  selector: 'app-generic-section-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="generic-editor">
      <div class="editor-top-row">
        <span class="save-hint" [class.saving]="saving" [class.error]="saveError">
          {{ saving ? 'Saving...' : saveError ? 'Save failed' : 'Autosave on' }}
        </span>
        <span class="char-count" [class.over]="textControl.value.length > 2000">
          {{ textControl.value.length }} / 2000
        </span>
      </div>

      <div class="toolbar-row">
        <button type="button" class="fmt-btn" title="Bold"      (click)="wrap('**','**')"><b>B</b></button>
        <button type="button" class="fmt-btn" title="Italic"    (click)="wrap('*','*')"><i>I</i></button>
        <button type="button" class="fmt-btn" title="Bullet"    (click)="insertBullet()">• List</button>
        <button type="button" class="fmt-btn" title="Heading"   (click)="wrap('### ','')">H3</button>
      </div>

      <textarea
        #editorArea
        class="generic-textarea"
        [formControl]="textControl"
        [placeholder]="placeholder"
        rows="10"></textarea>

      <p class="format-hint">
        Supports Markdown: **bold**, *italic*, bullet points with <code>-</code>, headings with <code>###</code>.
      </p>

      @if (saveError) {
        <div class="alert alert-error">{{ saveError }}</div>
      }
    </div>

    <style>
    .generic-editor { display: flex; flex-direction: column; gap: 10px; }

    .editor-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .save-hint { font-size: 0.75rem; color: var(--text-muted); }
    .save-hint.saving { color: var(--teal); }
    .save-hint.error  { color: #ef4444; }

    .char-count { font-size: 0.75rem; color: var(--text-muted); }
    .char-count.over { color: #ef4444; }

    .toolbar-row {
      display: flex;
      gap: 6px;
      padding: 6px 8px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px 8px 0 0;
    }

    .fmt-btn {
      background: none;
      border: 1px solid transparent;
      border-radius: 5px;
      padding: 3px 10px;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.82rem;
      transition: background 0.1s;
    }
    .fmt-btn:hover { background: rgba(255,255,255,0.06); border-color: var(--border); }

    .generic-textarea {
      width: 100%;
      padding: 12px;
      border-radius: 0 0 8px 8px;
      border: 1px solid var(--border);
      border-top: none;
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.9rem;
      resize: vertical;
      line-height: 1.65;
      box-sizing: border-box;
      font-family: inherit;
    }
    .generic-textarea:focus { border-color: var(--teal); outline: none; }

    .format-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
    }

    code {
      background: rgba(255,255,255,0.07);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.78rem;
    }
    </style>
  `
})
export class GenericSectionEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() saved = new EventEmitter<ResumeSection>();

  private sectionApi = inject(SectionApiService);
  private destroy$   = new Subject<void>();

  textControl = new FormControl('', { nonNullable: true });
  saving    = false;
  saveError = '';

  get placeholder(): string {
    const map: Record<string, string> = {
      CERTIFICATIONS: 'List your certifications, e.g.\n- AWS Certified Solutions Architect (2023)\n- Google Cloud Professional (2022)',
      PROJECTS:       'Describe your projects, e.g.\n### Project Name\nBrief description of what you built and the impact it had.',
      LANGUAGES:      'List languages and proficiency, e.g.\n- English (Native)\n- Spanish (Professional)\n- French (Conversational)',
      VOLUNTEER:      'Describe your volunteer work, e.g.\n- Organisation Name — Role (Year–Year)\n  What you did and the impact.',
      CUSTOM:         'Write any custom content for this section…'
    };
    return map[this.section?.sectionType] ?? 'Write your content here…';
  }

  ngOnChanges(): void {
    this.destroy$.next();
    this.saveError = '';

    let text = '';
    try {
      const parsed = JSON.parse(this.section.content || '{}');
      text = parsed.text || parsed.html || '';
    } catch {
      text = this.section.content || '';
    }
    this.textControl.setValue(text, { emitEvent: false });

    this.textControl.valueChanges.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(val => {
        this.saving = true;
        this.saveError = '';
        return this.sectionApi.updateSection(this.section.sectionId, {
          content: JSON.stringify({ text: val })
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

  wrap(prefix: string, suffix: string): void {
    const el = document.querySelector('.generic-textarea') as HTMLTextAreaElement;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const selected = el.value.substring(start, end) || 'text';
    const newVal = el.value.substring(0, start) + prefix + selected + suffix + el.value.substring(end);
    this.textControl.setValue(newVal);
    el.focus();
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  }

  insertBullet(): void {
    const el = document.querySelector('.generic-textarea') as HTMLTextAreaElement;
    if (!el) return;
    const pos    = el.selectionStart;
    const before = el.value.substring(0, pos);
    const after  = el.value.substring(pos);
    const nl     = before.length && !before.endsWith('\n') ? '\n' : '';
    const newVal = before + nl + '- ' + after;
    this.textControl.setValue(newVal);
    el.focus();
    const newPos = pos + nl.length + 2;
    el.setSelectionRange(newPos, newPos);
  }
}

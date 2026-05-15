import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Observable, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection, SectionType } from '../../../shared/models/models';
import { ConfirmService } from '../../../shared/services/confirm.service';

interface StructuredEntry {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

type EditorMode = 'STRUCTURED' | 'DESCRIPTION';

@Component({
  selector: 'app-generic-section-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="generic-editor">
      <div class="editor-top-row">
        <div class="top-left">
          <span class="save-hint" [class.saving]="saving" [class.error]="saveError">
            {{ saving ? 'Saving...' : saveError ? 'Save failed' : 'Autosave on' }}
          </span>
        </div>

        <div class="mode-toggle">
          <button type="button" class="mode-btn" [class.active]="mode === 'STRUCTURED'" (click)="setMode('STRUCTURED')">Structured</button>
          <button type="button" class="mode-btn" [class.active]="mode === 'DESCRIPTION'" (click)="setMode('DESCRIPTION')">Describe</button>
        </div>
      </div>

      <!-- Section Styling (Font Size) -->
      <div class="section-styling">
        <label class="style-label">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
          Section Font Size:
        </label>
        <input type="range" min="8" max="24" [formControl]="fontSizeControl" class="style-slider">
        <span class="style-val">{{ fontSizeControl.value }}px</span>
        <div class="align-toggle">
          <button type="button" class="align-btn" [class.active]="textAlignControl.value === 'left'" (click)="textAlignControl.setValue('left')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>
          </button>
          <button type="button" class="align-btn" [class.active]="textAlignControl.value === 'center'" (click)="textAlignControl.setValue('center')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
          </button>
        </div>
      </div>

      <!-- ── DESCRIPTION MODE (Markdown) ── -->
      @if (mode === 'DESCRIPTION') {
        <div class="description-editor anim-fade">
          <div class="toolbar-row">
            <button type="button" class="fmt-btn" title="Bold"      (click)="wrap('**','**')"><b>B</b></button>
            <button type="button" class="fmt-btn" title="Italic"    (click)="wrap('*','*')"><i>I</i></button>
            <button type="button" class="fmt-btn" title="Underline" (click)="wrap('++','++')"><u>U</u></button>
            <button type="button" class="fmt-btn" title="Strikethrough" (click)="wrap('~~','~~')"><s>S</s></button>
            <button type="button" class="fmt-btn" title="Bullet"    (click)="insertBullet()">• List</button>
            <button type="button" class="fmt-btn" title="Heading"   (click)="wrap('### ','')">H3</button>
            <span class="char-count" [class.over]="textControl.value.length > 2000">
              {{ textControl.value.length }} / 2000
            </span>
          </div>

          <textarea
            #editorArea
            class="generic-textarea"
            [formControl]="textControl"
            [placeholder]="placeholder"
            rows="12"></textarea>

          <p class="format-hint">
            Supports Markdown: **bold**, *italic*, ++underline++, ~~strike~~, bullet points with <code>-</code>, headings with <code>###</code>.
          </p>
        </div>
      }

      <!-- ── STRUCTURED MODE (Entries) ── -->
      @if (mode === 'STRUCTURED') {
        <div class="structured-editor anim-fade">
          <div class="entry-actions">
             <button type="button" class="add-entry-btn" (click)="addEntry()">+ Add Entry</button>
          </div>

          @if (!entries.length) {
            <div class="empty-entries">No entries yet. Click "+ Add Entry" to start.</div>
          }

          <div class="entry-list">
            @for (entryCtrl of structuredForm.controls; track i; let i = $index) {
              <div class="entry-card" [formGroup]="asFormGroup(entryCtrl)">
                <div class="entry-card-header">
                  <span class="entry-index">Entry {{ i + 1 }}</span>
                  <button type="button" class="entry-remove" (click)="removeEntry(i)">Remove</button>
                </div>

                <div class="entry-fields">
                  <div class="field-row">
                    <div class="field-group">
                      <label class="field-label">{{ getLabel('title') }} *</label>
                      <input class="field-input" formControlName="title" [placeholder]="getPlaceholder('title')" />
                    </div>
                    <div class="field-group">
                      <label class="field-label">{{ getLabel('subtitle') }}</label>
                      <input class="field-input" formControlName="subtitle" [placeholder]="getPlaceholder('subtitle')" />
                    </div>
                  </div>

                  <div class="field-row">
                    <div class="field-group">
                      <label class="field-label">{{ getLabel('startDate') }}</label>
                      <input class="field-input" formControlName="startDate" placeholder="e.g. Jan 2023" />
                    </div>
                    <div class="field-group">
                      <label class="field-label">{{ getLabel('endDate') }}</label>
                      <input class="field-input" formControlName="endDate" placeholder="e.g. Present"
                             [class.disabled-input]="asFormGroup(entryCtrl).get('isCurrent')?.value" />
                    </div>
                  </div>

                  <label class="current-chk">
                    <input type="checkbox" formControlName="isCurrent" />
                    {{ getLabel('isCurrent') }}
                  </label>

                  <div class="entry-bullets">
                    <div class="bullets-head">
                      <label class="field-label">{{ getBulletLabel() }}</label>
                      <button type="button" class="add-bullet-btn" (click)="addBullet(asFormGroup(entryCtrl))">{{ getAddBulletLabel() }}</button>
                    </div>
                    @for (bulletCtrl of getBullets(asFormGroup(entryCtrl)).controls; track bi; let bi = $index) {
                      <div class="bullet-row">
                        <span class="bullet-dot">•</span>
                        <input class="field-input bullet-input" [formControl]="$any(bulletCtrl)" [placeholder]="getBulletPlaceholder()" />
                        <button type="button" class="bullet-remove"
                                (click)="removeBullet(asFormGroup(entryCtrl), bi)"
                                [disabled]="getBullets(asFormGroup(entryCtrl)).length <= 1">✕</button>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (saveError) {
        <div class="alert alert-error">{{ saveError }}</div>
      }
    </div>

    <style>
    .generic-editor { display: flex; flex-direction: column; gap: 12px; min-height: 300px; }

    .editor-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .save-hint { font-size: 0.75rem; color: var(--text-muted); }
    .save-hint.saving { color: var(--teal); }
    .save-hint.error  { color: #ef4444; }

    /* Mode Toggle */
    .mode-toggle {
      display: flex;
      background: rgba(255,255,255,0.04);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .mode-btn {
      background: none;
      border: none;
      padding: 4px 12px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .mode-btn.active {
      background: var(--teal);
      color: #000;
    }

    .anim-fade { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* Description Mode Styles */
    .toolbar-row {
      display: flex;
      gap: 6px;
      padding: 6px 12px;
      background: #1a1f2e;
      border: 1px solid var(--border);
      border-radius: 10px 10px 0 0;
      align-items: center;
    }
    .fmt-btn {
      background: none; border: 1px solid transparent; border-radius: 5px;
      padding: 4px 10px; cursor: pointer; color: var(--text-secondary);
      font-size: 0.82rem; transition: background 0.1s;
    }
    .fmt-btn:hover { background: rgba(255,255,255,0.06); border-color: var(--border); }
    .char-count { margin-left: auto; font-size: 0.7rem; color: var(--text-muted); }
    .char-count.over { color: #ef4444; }

    .generic-textarea {
      width: 100%; padding: 14px; border-radius: 0 0 10px 10px;
      border: 1px solid var(--border); border-top: none;
      background: #111520; color: var(--text-primary);
      font-size: 0.9rem; resize: vertical; line-height: 1.6;
      box-sizing: border-box; font-family: inherit;
    }
    .generic-textarea:focus { border-color: var(--teal); outline: none; }
    .format-hint { font-size: 0.72rem; color: var(--text-muted); margin-top: 6px; }
    code { background: rgba(255,255,255,0.07); padding: 1px 4px; border-radius: 3px; }

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
    .align-toggle {
      display: flex; align-items: center; gap: 4px; margin-left: auto; padding-left: 8px;
    }
    .align-btn {
      width: 28px; height: 28px; display: grid; place-items: center;
      border-radius: 6px; border: 1px solid var(--border);
      background: rgba(255,255,255,0.04); color: var(--text-secondary); cursor: pointer;
    }
    .align-btn.active {
      border-color: rgba(0,212,180,0.35);
      background: rgba(0,212,180,0.14);
      color: var(--teal);
    }

    /* Structured Mode Styles */
    .structured-editor { display: flex; flex-direction: column; gap: 14px; }
    .entry-actions { display: flex; justify-content: flex-end; }
    .add-entry-btn {
      background: rgba(0,212,180,0.1); border: 1px solid rgba(0,212,180,0.2);
      color: var(--teal); padding: 6px 14px; border-radius: 8px;
      font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    .add-entry-btn:hover { background: rgba(0,212,180,0.15); }

    .empty-entries {
       padding: 30px; text-align: center; border: 1px dashed var(--border);
       border-radius: 10px; color: var(--text-muted); font-size: 0.82rem;
    }

    .entry-list { display: flex; flex-direction: column; gap: 16px; }
    .entry-card {
      background: #111520; border: 1px solid var(--border);
      border-radius: 12px; overflow: hidden;
    }
    .entry-card-header {
      background: rgba(255,255,255,0.02); padding: 8px 16px;
      border-bottom: 1px solid var(--border); display: flex;
      justify-content: space-between; align-items: center;
    }
    .entry-index { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .entry-remove {
      background: none; border: none; color: #ef4444; font-size: 0.7rem;
      font-weight: 600; cursor: pointer; padding: 2px 6px; border-radius: 4px;
    }
    .entry-remove:hover { background: rgba(239,68,68,0.1); }

    .entry-fields { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-group { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
    .field-input {
      background: #0d1117; border: 1px solid var(--border); border-radius: 6px;
      color: #fff; padding: 7px 10px; font-size: 0.85rem; outline: none; width: 100%;
    }
    .field-input:focus { border-color: var(--teal); }
    .disabled-input { opacity: 0.4; pointer-events: none; }

    .current-chk { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--text-muted); cursor: pointer; }

    .entry-bullets { margin-top: 6px; display: flex; flex-direction: column; gap: 8px; }
    .bullets-head { display: flex; justify-content: space-between; align-items: center; }
    .add-bullet-btn {
      background: none; border: 1px solid rgba(0,212,180,0.3); color: var(--teal);
      font-size: 0.65rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; cursor: pointer;
    }
    .bullet-row { display: flex; align-items: center; gap: 8px; }
    .bullet-dot { color: var(--teal); font-size: 1.2rem; line-height: 1; }
    .bullet-input { font-size: 0.82rem; }
    .bullet-remove {
      background: none; border: none; color: var(--text-muted); font-size: 0.75rem;
      cursor: pointer; padding: 4px; opacity: 0.5;
    }
    .bullet-remove:hover { color: #ef4444; opacity: 1; }
    .bullet-remove:disabled { display: none; }
    </style>
  `
})
export class GenericSectionEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() saved = new EventEmitter<ResumeSection>();

  private sectionApi = inject(SectionApiService);
  private confirmService = inject(ConfirmService);
  private destroy$   = new Subject<void>();

  mode: EditorMode = 'DESCRIPTION';
  textControl = new FormControl('', { nonNullable: true });
  fontSizeControl = new FormControl(12, { nonNullable: true });
  textAlignControl = new FormControl<'left' | 'center'>('left', { nonNullable: true });
  structuredForm = new FormArray<any>([]);
  saving    = false;
  saveError = '';

  get entries(): FormGroup[] { return this.structuredForm.controls as FormGroup[]; }

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

    const content = this.section.content || '';
    let parsed: any = null;
    try { parsed = JSON.parse(content); } catch { parsed = content; }

    const fs = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? (parsed.fontSize || 12) : 12;
    const textAlign = (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.textAlign === 'center') ? 'center' : 'left';
    this.fontSizeControl.setValue(fs, { emitEvent: false });
    this.textAlignControl.setValue(textAlign, { emitEvent: false });

    // Detect mode based on content structure
    if (Array.isArray(parsed) || (parsed && parsed.items)) {
      this.mode = 'STRUCTURED';
      const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
      this.structuredForm = new FormArray<any>(items.map((e: any) => this.buildEntry(e)));
    } else {
      this.mode = 'DESCRIPTION';
      const text = (typeof parsed === 'object' && parsed !== null) ? (parsed.text || parsed.html || '') : String(parsed || '');
      this.textControl.setValue(text, { emitEvent: false });
      this.structuredForm = new FormArray<any>([]);
    }

    // Combined auto-save logic
    const update$ = new Subject<void>();

    this.textControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());
    this.structuredForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());
    this.fontSizeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());
    this.textAlignControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());

    update$.pipe(
      debounceTime(800),
      switchMap(() => {
        const data = this.mode === 'DESCRIPTION'
          ? { text: this.textControl.value, fontSize: this.fontSizeControl.value, textAlign: this.textAlignControl.value }
          : { items: this.structuredForm.value, fontSize: this.fontSizeControl.value, textAlign: this.textAlignControl.value };
        return this.save(data);
      }),
      takeUntil(this.destroy$)
    ).subscribe((updated: ResumeSection) => this.onSaveSuccess(updated));
  }

  async setMode(m: EditorMode): Promise<void> {
    if (this.mode === m) return;
    const confirmed = await this.confirmService.ask({
      title: 'Switch Mode',
      message: `Switch to ${m === 'STRUCTURED' ? 'Structured' : 'Description'} mode? Some current content might be reformatted.`,
      confirmText: 'Switch Mode',
      type: 'info'
    });
    if (!confirmed) return;

    this.mode = m;
    if (m === 'STRUCTURED') {
      // Initialize with one empty entry if empty
      if (this.structuredForm.length === 0) this.addEntry();
    } else {
      // Conversion from structured to description could be done here, but for now we just reset
      this.textControl.setValue('');
    }
  }

  // ── Structured Actions ──────────────────────────────────────────────────

  addEntry(): void {
    this.structuredForm.push(this.buildEntry({
      title: '', subtitle: '', startDate: '', endDate: '', isCurrent: false, bullets: ['']
    }));
  }

  removeEntry(index: number): void {
    this.structuredForm.removeAt(index);
  }

  getBullets(entryGroup: FormGroup): FormArray {
    return entryGroup.get('bullets') as FormArray;
  }

  addBullet(entryGroup: FormGroup): void {
    this.getBullets(entryGroup).push(new FormControl('', { nonNullable: true }));
  }

  removeBullet(entryGroup: FormGroup, bulletIndex: number): void {
    this.getBullets(entryGroup).removeAt(bulletIndex);
  }

  asFormGroup(ctrl: AbstractControl): FormGroup { return ctrl as FormGroup; }

  // ── Labels & Placeholders ───────────────────────────────────────────────

  getLabel(field: string): string {
    const type = this.section.sectionType;
    const labels: Record<string, Record<string, string>> = {
      PROJECTS: {
        title: 'Project Name',
        subtitle: 'Role / Project Link',
        startDate: 'Start Date',
        endDate: 'End Date',
        isCurrent: 'Currently working on this'
      },
      CERTIFICATIONS: {
        title: 'Certification Name',
        subtitle: 'Issuer / Organization',
        startDate: 'Date Obtained',
        endDate: 'Expiry Date',
        isCurrent: 'Does not expire'
      },
      VOLUNTEER: {
        title: 'Role / Achievement',
        subtitle: 'Organization',
        startDate: 'Start Date',
        endDate: 'End Date',
        isCurrent: 'Currently active'
      },
      DEFAULT: {
        title: 'Title',
        subtitle: 'Subtitle / Location',
        startDate: 'Start Date',
        endDate: 'End Date',
        isCurrent: 'Currently active'
      }
    };
    return (labels[type] || labels['DEFAULT'])[field] || field;
  }

  getPlaceholder(field: string): string {
    const type = this.section.sectionType;
    if (type === 'PROJECTS' && field === 'title') return 'e.g. AI Resume Builder';
    if (type === 'CERTIFICATIONS' && field === 'title') return 'e.g. AWS Solutions Architect';
    if (type === 'VOLUNTEER' && field === 'subtitle') return 'e.g. Tech Wizard Club';
    return '';
  }

  // ── Internal Helpers ────────────────────────────────────────────────────

  getBulletLabel(): string {
    switch (this.section.sectionType) {
      case 'PROJECTS':
        return 'Features';
      case 'VOLUNTEER':
        return 'Responsibilities / Impact';
      default:
        return 'Details / Highlights';
    }
  }

  getAddBulletLabel(): string {
    switch (this.section.sectionType) {
      case 'PROJECTS':
        return '+ Add Feature';
      default:
        return '+ Add Bullet';
    }
  }

  getBulletPlaceholder(): string {
    switch (this.section.sectionType) {
      case 'PROJECTS':
        return 'Describe a feature, result, or tech used...';
      case 'CERTIFICATIONS':
        return 'Add any relevant detail or achievement...';
      case 'VOLUNTEER':
        return 'Describe your contribution or impact...';
      default:
        return 'Describe a task or achievement...';
    }
  }

  private buildEntry(e: any): FormGroup {
    const normalizedBullets = Array.isArray(e?.bullets)
      ? e.bullets.map((b: string) => (b || '').trim()).filter(Boolean)
      : [];

    const bulletValues = normalizedBullets.length > 0 ? normalizedBullets : [''];

    return new FormGroup({
      title:     new FormControl(e.title     || '', { nonNullable: true, validators: [Validators.required] }),
      subtitle:  new FormControl(e.subtitle  || '', { nonNullable: true }),
      startDate: new FormControl(e.startDate || '', { nonNullable: true }),
      endDate:   new FormControl(e.endDate   || '', { nonNullable: true }),
      isCurrent: new FormControl(e.isCurrent || false, { nonNullable: true }),
      bullets:   new FormArray(bulletValues.map((b: string) => new FormControl(b, { nonNullable: true })))
    });
  }

  private save(data: any): Observable<ResumeSection> {
    this.saving = true;
    this.saveError = '';
    return this.sectionApi.updateSection(this.section.sectionId, {
      content: JSON.stringify(data)
    }).pipe(
      catchError(() => {
        this.saving = false;
        this.saveError = 'Save failed.';
        return EMPTY;
      })
    );
  }

  private onSaveSuccess(updated: ResumeSection): void {
    this.saving = false;
    this.saved.emit(updated);
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

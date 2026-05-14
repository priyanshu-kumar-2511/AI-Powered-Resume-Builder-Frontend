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

      <!-- Technical Skills Section -->
      <div class="skill-category">
        <div class="category-header">
          <h4>Technical Skills</h4>
          <span class="skill-count">{{ technicalSkills.length }} skill{{ technicalSkills.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="chip-area">
          @for (skill of technicalSkills; track i; let i = $index) {
            <span class="skill-chip">
              {{ skill }}
              <button type="button" class="chip-remove" (click)="removeSkill('technical', i)" title="Remove">✕</button>
            </span>
          }
          @if (!technicalSkills.length) {
            <span class="chip-placeholder">No technical skills added yet.</span>
          }
        </div>
        <div class="input-row">
          <input
            class="skill-input"
            [formControl]="techInputControl"
            placeholder="Type a technical skill and press Enter…"
            (keydown.enter)="$event.preventDefault(); addFromInput('technical')"
            (keydown.comma)="$event.preventDefault(); addFromInput('technical')" />
          <button type="button" class="btn btn-ghost btn-sm" (click)="addFromInput('technical')">Add</button>
        </div>
      </div>

      <!-- Soft Skills Section -->
      <div class="skill-category">
        <div class="category-header">
          <h4>Soft Skills</h4>
          <span class="skill-count">{{ softSkills.length }} skill{{ softSkills.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="chip-area soft-chip-area">
          @for (skill of softSkills; track i; let i = $index) {
            <span class="skill-chip soft-chip">
              {{ skill }}
              <button type="button" class="chip-remove" (click)="removeSkill('soft', i)" title="Remove">✕</button>
            </span>
          }
          @if (!softSkills.length) {
            <span class="chip-placeholder">No soft skills added yet.</span>
          }
        </div>
        <div class="input-row">
          <input
            class="skill-input"
            [formControl]="softInputControl"
            placeholder="Type a soft skill and press Enter…"
            (keydown.enter)="$event.preventDefault(); addFromInput('soft')"
            (keydown.comma)="$event.preventDefault(); addFromInput('soft')" />
          <button type="button" class="btn btn-ghost btn-sm" (click)="addFromInput('soft')">Add</button>
        </div>
      </div>

      @if (saveError) {
        <div class="alert alert-error" style="margin-top:8px;">{{ saveError }}</div>
      }
    </div>

    <style>
    .skills-editor { display: flex; flex-direction: column; gap: 20px; }
    .editor-top-row { display: flex; justify-content: flex-end; align-items: center; margin-bottom: -10px; }

    /* Section Styling */
    .section-styling {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: rgba(255,255,255,0.03);
      border: 1px solid var(--border); border-radius: 10px;
      margin-bottom: -8px;
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
    .save-hint.error  { color: #ef4444; }
    
    .skill-category { display: flex; flex-direction: column; gap: 10px; }
    .category-header { display: flex; justify-content: space-between; align-items: center; }
    .category-header h4 { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
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

    .soft-chip-area { background: rgba(59, 130, 246, 0.03); border-color: rgba(59, 130, 246, 0.2); }

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

    .soft-chip {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25);
      color: #60a5fa;
    }

    .chip-remove {
      background: none;
      border: none;
      cursor: pointer;
      color: inherit;
      font-size: 0.7rem;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
    }
    .chip-remove:hover { opacity: 1; }

    .input-row { display: flex; gap: 8px; }
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
  technicalSkills: string[] = [];
  softSkills: string[]      = [];
  techInputControl          = new FormControl('', { nonNullable: true });
  softInputControl          = new FormControl('', { nonNullable: true });
  fontSizeControl           = new FormControl(12, { nonNullable: true });
  saving                    = false;
  saveError                 = '';
  private save$             = new Subject<void>();

  ngOnChanges(): void {
    this.destroy$.next();
    this.saveError = '';

    try {
      const parsed = JSON.parse(this.section.content || '{}');
      let fontSize = 12;
      let skillData: any = parsed;

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.technical || parsed.soft || parsed.fontSize)) {
        fontSize = parsed.fontSize || 12;
        skillData = parsed;
      }

      this.fontSizeControl.setValue(fontSize, { emitEvent: false });

      if (Array.isArray(skillData)) {
        this.technicalSkills = skillData;
        this.softSkills = [];
      } else if (skillData && typeof skillData === 'object') {
        this.technicalSkills = Array.isArray(skillData['technical']) ? skillData['technical'] : [];
        this.softSkills = Array.isArray(skillData['soft']) ? skillData['soft'] : [];
      } else {
        this.technicalSkills = [];
        this.softSkills = [];
      }
    } catch {
      this.technicalSkills = [];
      this.softSkills = [];
    }

    this.fontSizeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.save$.next());

    this.save$.pipe(
      debounceTime(600),
      switchMap(() => {
        this.saving = true;
        this.saveError = '';
        const payload = { 
          technical: this.technicalSkills, 
          soft: this.softSkills, 
          fontSize: this.fontSizeControl.value 
        };
        return this.sectionApi.updateSection(this.section.sectionId, {
          content: JSON.stringify(payload)
        }).pipe(
          catchError(() => {
            this.saving = false;
            this.saveError = 'Save failed.';
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((updated: ResumeSection) => {
      this.saving = false;
      this.saved.emit(updated);
    });
  }

  addFromInput(type: 'technical' | 'soft'): void {
    const control = type === 'technical' ? this.techInputControl : this.softInputControl;
    const raw = control.value.trim().replace(/,$/, '').trim();
    if (!raw) return;

    const list = type === 'technical' ? this.technicalSkills : this.softSkills;
    const newSkills = raw.split(',')
      .map(s => s.trim())
      .filter(s => s && !list.includes(s));

    if (!newSkills.length) {
      control.reset();
      return;
    }

    if (type === 'technical') {
      this.technicalSkills = [...this.technicalSkills, ...newSkills];
    } else {
      this.softSkills = [...this.softSkills, ...newSkills];
    }
    
    control.reset();
    this.save$.next();
  }

  removeSkill(type: 'technical' | 'soft', index: number): void {
    if (type === 'technical') {
      this.technicalSkills = this.technicalSkills.filter((_, i) => i !== index);
    } else {
      this.softSkills = this.softSkills.filter((_, i) => i !== index);
    }
    this.save$.next();
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiApiService } from '../services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PremiumLockComponent } from '../shared/premium-lock.component';

const SECTION_TYPES = ['SUMMARY', 'PROJECTS', 'CERTIFICATIONS', 'LANGUAGES', 'VOLUNTEER', 'CUSTOM'];

@Component({
  selector: 'app-section-improver',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumLockComponent],
  template: `
    @if (!isPremium) {
      <app-premium-lock message="Rewrite any section with AI for better impact and tone." />
    } @else {
      <div class="improver">
        <div class="ai-gen-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Section Improver
        </div>

        <div class="form-group">
          <label class="ai-label">Target Section</label>
          <select class="ai-select" [(ngModel)]="selectedSection">
            <option value="">Select section type...</option>
            @for (t of sectionTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="ai-label">Content to Improve</label>
            <button class="paste-btn" (click)="editableContent = currentContent" [disabled]="!currentContent">
              <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" fill="currentColor" stroke="none"/></svg>
              Paste from current
            </button>
          </div>
          <textarea class="ai-textarea"
                    placeholder="Paste the section content you want to improve here, or click 'Paste from current' above..."
                    [(ngModel)]="editableContent"
                    rows="6"></textarea>
          @if (selectedSectionType && !sectionTypes.includes(selectedSectionType)) {
            <p class="ai-note-warn">⚠️ This tool works best for Summary, Projects, etc. Use specialized tools for Skills/Experience.</p>
          }
        </div>

        <button class="ai-btn" (click)="improve()" [disabled]="loading || !selectedSection || !editableContent.trim()">
          @if (loading) { <span class="ai-spinner"></span> Improving... }
          @else { Improve with AI }
        </button>

        @if (error) { <p class="ai-error">{{ error }}</p> }

        @if (improved) {
          <div class="diff-view">
            <div class="diff-col">
              <p class="diff-label">Original</p>
              <pre class="diff-text original">{{ editableContent }}</pre>
            </div>
            <div class="diff-col">
              <p class="diff-label improved-label">Improved</p>
              <pre class="diff-text improved">{{ improved }}</pre>
            </div>
          </div>
          <div class="diff-actions">
            <button class="ai-accept" (click)="applyChanges()">Apply Changes</button>
            <button class="ai-discard" (click)="improved = ''">Discard</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .improver { display: flex; flex-direction: column; gap: 14px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .label-row { display: flex; align-items: center; justify-content: space-between; }
    .ai-label { font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; }
    
    .paste-btn {
      display: flex; align-items: center; gap: 4px;
      background: rgba(0,212,180,0.08); border: 1px solid rgba(0,212,180,0.2);
      border-radius: 4px; color: #00d4b4; font-size: 0.6rem; font-weight: 700;
      padding: 2px 8px; cursor: pointer; transition: all 0.2s;
    }
    .paste-btn:hover:not(:disabled) { background: rgba(0,212,180,0.15); border-color: rgba(0,212,180,0.4); }
    .paste-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    
    .ai-select, .ai-textarea {
      background: #171c26;
      border: 1px solid rgba(0,212,180,0.35);
      border-radius: 8px;
      color: #f8fafc;
      font-size: 0.8rem;
      padding: 10px 12px;
      font-family: inherit;
      outline: none;
      transition: all 0.2s;
    }
    .ai-textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
    .ai-select:focus, .ai-textarea:focus { border-color: rgba(0,212,180,0.4); background: rgba(255,255,255,0.05); }
    .ai-select { color-scheme: dark; }
    .ai-select option {
      background: #0f172a;
      color: #f8fafc;
    }
    .ai-select option:checked {
      background: #0f766e;
      color: #ffffff;
    }
    .ai-textarea::placeholder {
      color: rgba(255,255,255,0.32);
    }
    
    .ai-note-warn { margin: 0; font-size: 0.72rem; color: #fbbf24; font-weight: 500; }
    
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.2), rgba(0,212,180,0.1)); border: 1px solid rgba(0,212,180,0.4); color: #00d4b4; font-size: 0.82rem; font-weight: 700; padding: 11px 14px; border-radius: 9px; cursor: pointer; font-family: inherit; transition: all 0.2s; margin-top: 4px; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.25); transform: translateY(-1px); }
    .ai-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .diff-view { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 10px; }
    .diff-col { display: flex; flex-direction: column; gap: 5px; }
    .diff-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); margin: 0; }
    .improved-label { color: #00d4b4; }
    .diff-text { font-size: 0.75rem; line-height: 1.55; white-space: pre-wrap; font-family: inherit; margin: 0; padding: 12px; border-radius: 8px; max-height: 160px; overflow-y: auto; }
    .original { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
    .improved { background: rgba(0,212,180,0.04); border: 1px solid rgba(0,212,180,0.15); color: #fff; }
    .diff-actions { display: flex; gap: 8px; margin-top: 8px; }
    .ai-accept { flex: 1; background: #00d4b4; color: #000; border: none; font-size: 0.78rem; font-weight: 700; padding: 10px; border-radius: 7px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-accept:hover { background: #00f2ce; box-shadow: 0 0 15px rgba(0,212,180,0.3); }
    .ai-discard { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); font-size: 0.75rem; padding: 10px 14px; border-radius: 7px; cursor: pointer; font-family: inherit; }
    .ai-discard:hover { border-color: rgba(239,68,68,0.3); color: #ef4444; }
  `]
})
export class SectionImproverComponent implements OnChanges {
  @Input({ required: true }) resumeId!: number;
  @Input() selectedSectionType = '';
  @Input() currentContent = '';
  @Output() contentApplied = new EventEmitter<string>();

  private aiApi = inject(AiApiService);
  private auth = inject(AuthService);

  readonly sectionTypes = SECTION_TYPES;
  selectedSection = '';
  editableContent = '';
  improved = '';
  loading = false;
  error = '';

  get isPremium(): boolean { return this.auth.getCurrentPlan() === 'PREMIUM'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedSectionType'] && this.sectionTypes.includes(this.selectedSectionType)) {
      this.selectedSection = this.selectedSectionType;
    }
    if (changes['currentContent']) {
      this.editableContent = this.currentContent;
    }
  }

  improve(): void {
    if (!this.editableContent.trim()) return;
    this.loading = true;
    this.error = '';
    this.improved = '';

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.improveSection({
      userId,
      resumeId: this.resumeId,
      sectionType: this.selectedSection,
      existingContent: this.editableContent
    }).subscribe({
      next: res => { this.improved = res.content ?? ''; this.loading = false; },
      error: err => { this.error = err?.error?.message ?? 'Failed to improve section.'; this.loading = false; }
    });
  }

  applyChanges(): void {
    this.contentApplied.emit(this.improved);
    this.improved = '';
  }
}

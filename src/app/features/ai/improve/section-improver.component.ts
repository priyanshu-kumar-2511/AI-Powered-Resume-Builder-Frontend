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

        @if (selectedSectionType && sectionTypes.includes(selectedSectionType)) {
          <div class="selected-type-badge">Editing {{ selectedSectionType }}</div>
        } @else {
          <select class="ai-select" [(ngModel)]="selectedSection">
            <option value="">Select section type...</option>
            @for (t of sectionTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        }

        @if (selectedSectionType && !sectionTypes.includes(selectedSectionType)) {
          <p class="ai-note">AI rewrite is available for summary and free-text sections. Use bullets or skills tools for structured sections.</p>
        }

        <button class="ai-btn" (click)="improve()" [disabled]="loading || !selectedSection || !currentContent || (selectedSectionType && !sectionTypes.includes(selectedSectionType))">
          @if (loading) { <span class="ai-spinner"></span> Improving... }
          @else { Improve with AI }
        </button>

        @if (error) { <p class="ai-error">{{ error }}</p> }

        @if (improved) {
          <div class="diff-view">
            <div class="diff-col">
              <p class="diff-label">Original</p>
              <pre class="diff-text original">{{ currentContent }}</pre>
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
    .improver { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .ai-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 8px 10px; font-family: inherit; outline: none; transition: border-color 0.2s; }
    .ai-select:focus { border-color: rgba(0,212,180,0.4); }
    .selected-type-badge { background: rgba(0,212,180,0.08); border: 1px solid rgba(0,212,180,0.2); color: #00d4b4; border-radius: 7px; padding: 8px 10px; font-size: 0.78rem; font-weight: 600; }
    .ai-note { margin: 0; font-size: 0.74rem; line-height: 1.5; color: rgba(255,255,255,0.45); }
    .ai-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, rgba(0,212,180,0.15), rgba(0,212,180,0.08)); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.78rem; font-weight: 600; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .ai-btn:hover:not(:disabled) { background: rgba(0,212,180,0.2); }
    .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,212,180,0.3); border-top-color: #00d4b4; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-error { font-size: 0.75rem; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 8px 10px; border-radius: 7px; }
    .diff-view { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .diff-col { display: flex; flex-direction: column; gap: 5px; }
    .diff-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); margin: 0; }
    .improved-label { color: #00d4b4; }
    .diff-text { font-size: 0.75rem; line-height: 1.55; white-space: pre-wrap; font-family: inherit; margin: 0; padding: 10px; border-radius: 7px; max-height: 200px; overflow-y: auto; }
    .original { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
    .improved { background: rgba(0,212,180,0.04); border: 1px solid rgba(0,212,180,0.15); color: rgba(255,255,255,0.8); }
    .diff-actions { display: flex; gap: 8px; }
    .ai-accept { flex: 1; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; font-size: 0.75rem; font-weight: 600; padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .ai-discard { background: transparent; border: 1px solid rgba(239,68,68,0.2); color: rgba(239,68,68,0.7); font-size: 0.75rem; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; }
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
  improved = '';
  loading = false;
  error = '';

  get isPremium(): boolean { return this.auth.getCurrentPlan() === 'PREMIUM'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedSectionType'] && this.sectionTypes.includes(this.selectedSectionType)) {
      this.selectedSection = this.selectedSectionType;
    }
  }

  improve(): void {
    this.loading = true;
    this.error = '';
    this.improved = '';

    const userId = String(this.auth.getCurrentUserId() ?? '');
    this.aiApi.improveSection({
      userId,
      resumeId: this.resumeId,
      sectionType: this.selectedSection,
      existingContent: this.currentContent
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

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { AiApiService } from '../services/ai-api.service';

@Component({
  selector: 'app-skill-suggestions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skill-suggestions">
      <div class="ai-gen-header">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
        Suggested Skills
      </div>

      @if (loading) {
        <div class="shimmer-row">
          @for (s of [1,2,3,4,5]; track s) {
            <div class="shimmer-chip"></div>
          }
        </div>
      }

      @if (!loading && skills.length) {
        <div class="chips-wrap">
          @for (skill of skills; track skill) {
            <button class="skill-chip" [class.added]="addedSkills.has(skill)" (click)="addSkill(skill)" [disabled]="addedSkills.has(skill)">
              @if (!addedSkills.has(skill)) { + }
              {{ skill }}
            </button>
          }
        </div>
      }

      @if (!loading && !skills.length) {
        <p class="no-skills">No suggestions available for this job title.</p>
      }
    </div>
  `,
  styles: [`
    .skill-suggestions { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
    .ai-gen-header { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; font-weight: 700; color: #00d4b4; text-transform: uppercase; letter-spacing: 0.06em; }
    .shimmer-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .shimmer-chip { height: 28px; width: 80px; border-radius: 20px; background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-chip { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 0.75rem; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .skill-chip:hover:not(:disabled) { background: rgba(0,212,180,0.1); border-color: rgba(0,212,180,0.3); color: #00d4b4; }
    .skill-chip.added { background: rgba(0,212,180,0.08); border-color: rgba(0,212,180,0.25); color: #00d4b4; opacity: 0.7; cursor: default; }
    .no-skills { font-size: 0.78rem; color: rgba(255,255,255,0.3); }
  `]
})
export class SkillSuggestionsComponent implements OnChanges {
  @Input({ required: true }) resumeId!: number;
  @Input() jobTitle = '';
  @Output() skillAdded = new EventEmitter<string>();

  private aiApi = inject(AiApiService);

  skills: string[]        = [];
  addedSkills             = new Set<string>();
  loading                 = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobTitle'] && this.jobTitle.trim()) {
      this.loadSkills();
    }
  }

  loadSkills(): void {
    this.loading = true;
    this.aiApi.suggestSkills(this.resumeId, this.jobTitle).subscribe({
      next: skills => { this.skills = skills; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  addSkill(skill: string): void {
    this.addedSkills.add(skill);
    this.skillAdded.emit(skill);
  }
}

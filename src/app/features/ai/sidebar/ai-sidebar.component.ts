import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { QuotaBadgeComponent } from '../quota/quota-badge.component';
import { AiSummaryGeneratorComponent } from '../summary/ai-summary-generator.component';
import { AiBulletsGeneratorComponent } from '../bullets/ai-bullets-generator.component';
import { SkillSuggestionsComponent } from '../skills/skill-suggestions.component';
import { AtsCheckerComponent } from '../ats/ats-checker.component';
import { CoverLetterGeneratorComponent } from '../cover-letter/cover-letter-generator.component';
import { SectionImproverComponent } from '../improve/section-improver.component';
import { ResumeTailorComponent } from '../tailor/resume-tailor.component';
import { TranslateResumeComponent } from '../translate/translate-resume.component';
import { AiHistoryComponent } from '../history/ai-history.component';

type AiTab = 'generate' | 'improve' | 'ats' | 'translate' | 'history';

@Component({
  selector: 'app-ai-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    QuotaBadgeComponent,
    AiSummaryGeneratorComponent,
    AiBulletsGeneratorComponent,
    SkillSuggestionsComponent,
    AtsCheckerComponent,
    CoverLetterGeneratorComponent,
    SectionImproverComponent,
    ResumeTailorComponent,
    TranslateResumeComponent,
    AiHistoryComponent
  ],
  template: `
    <!-- Toggle button (outside panel) -->
    <button class="ai-toggle" (click)="collapsed = !collapsed" [title]="collapsed ? 'Open AI panel' : 'Close AI panel'">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        @if (collapsed) {
          <path d="M12 2a10 10 0 1 0 10 10"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
          <path d="M18 2l4 4-4 4M22 6H14"/>
        } @else {
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        }
      </svg>
      @if (collapsed) { AI }
    </button>

    <!-- Panel -->
    <div class="ai-sidebar" [class.open]="!collapsed">
      <!-- Header -->
      <div class="ai-header">
        <div class="ai-title">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 1 0 10 10"/>
            <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/>
          </svg>
          AI Assistant
        </div>
        <app-quota-badge />
      </div>

      <!-- Tab nav -->
      <div class="ai-tabs">
        @for (tab of tabs; track tab.id) {
          <button class="ai-tab" [class.active]="activeTab === tab.id" (click)="activeTab = tab.id">
            @if (tab.premium && !isPremium) {
              <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2"/>
              </svg>
            }
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Tab content -->
      <div class="ai-content">
        @if (activeTab === 'generate') {
          <!-- Summary: accepted text bubbles up to parent via summaryAccepted output -->
          <app-ai-summary-generator
            [resumeId]="resumeId"
            (summaryAccepted)="summaryAccepted.emit($event)" />
          <div class="ai-section-divider"></div>

          <!-- Bullets: accepted bullet bubbles up via bulletAccepted output -->
          <app-ai-bullets-generator
            [resumeId]="resumeId"
            [role]="targetJobTitle"
            (bulletAccepted)="bulletAccepted.emit($event)" />
          <div class="ai-section-divider"></div>

          <!-- Skills: selected skill bubbles up via skillAdded output -->
          <app-skill-suggestions
            [resumeId]="resumeId"
            [jobTitle]="targetJobTitle"
            (skillAdded)="skillAdded.emit($event)" />
        }

        @if (activeTab === 'improve') {
          <app-cover-letter-generator [resumeId]="resumeId" [targetJobTitle]="targetJobTitle" />
          <div class="ai-section-divider"></div>
          <app-section-improver
            [resumeId]="resumeId"
            [selectedSectionType]="currentSectionType"
            [currentContent]="currentSectionContent"
            (contentApplied)="improvedContent.emit($event)" />
          <div class="ai-section-divider"></div>
          <app-resume-tailor [resumeId]="resumeId" [resumeContent]="fullResumeContent" />
        }

        @if (activeTab === 'ats') {
          <app-ats-checker
            [resumeId]="resumeId"
            [resumeContent]="fullResumeContent"
            (scoreUpdated)="atsScore.emit($event)" />
        }

        @if (activeTab === 'translate') {
          <app-translate-resume [resumeId]="resumeId" [resumeContent]="fullResumeContent" />
        }

        @if (activeTab === 'history') {
          <app-ai-history />
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .ai-toggle {
      position: fixed; right: 16px; top: 50%;
      transform: translateY(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      width: 36px; padding: 10px 0;
      background: #0d1117;
      border: 1px solid rgba(0,212,180,0.25);
      border-radius: 10px;
      color: #00d4b4; font-size: 0.6rem; font-weight: 700;
      cursor: pointer; font-family: inherit;
      transition: all 0.2s; z-index: 50;
      box-shadow: 0 4px 20px rgba(0,212,180,0.1);
    }
    .ai-toggle:hover { background: rgba(0,212,180,0.08); box-shadow: 0 4px 20px rgba(0,212,180,0.2); }

    .ai-sidebar {
      position: fixed; right: 0; top: 56px; bottom: 0;
      width: 0; overflow: hidden;
      transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
      background: #0a0d14;
      border-left: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column;
      z-index: 40;
    }
    .ai-sidebar.open { width: 320px; }

    .ai-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0; gap: 10px; flex-wrap: wrap;
    }
    .ai-title {
      display: flex; align-items: center; gap: 7px;
      font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.85);
    }

    .ai-tabs {
      display: flex; gap: 2px; padding: 8px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0; flex-wrap: wrap;
    }
    .ai-tab {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 10px; border-radius: 6px;
      background: transparent; border: 1px solid transparent;
      color: rgba(255,255,255,0.45); font-size: 0.72rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: all 0.15s;
      white-space: nowrap;
    }
    .ai-tab:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); }
    .ai-tab.active { background: rgba(0,212,180,0.1); border-color: rgba(0,212,180,0.2); color: #00d4b4; }

    .ai-content {
      flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    }
    .ai-content::-webkit-scrollbar { width: 4px; }
    .ai-content::-webkit-scrollbar-track { background: transparent; }
    .ai-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .ai-section-divider {
      height: 1px; background: rgba(255,255,255,0.05);
      margin: 4px 16px;
    }
  `]
})
export class AiSidebarComponent implements OnInit {
  @Input({ required: true }) resumeId!: number;
  @Input() targetJobTitle = '';
  @Input() currentSectionType = '';
  @Input() currentSectionContent = '';
  @Input() fullResumeContent = '';

  // ── Outputs — bubble accepted AI content up to the builder-layout ──────────
  @Output() summaryAccepted = new EventEmitter<string>();
  @Output() bulletAccepted  = new EventEmitter<string>();
  @Output() skillAdded      = new EventEmitter<string>();
  @Output() improvedContent = new EventEmitter<string>();
  @Output() atsScore        = new EventEmitter<number>();

  private auth = inject(AuthService);

  collapsed = true;
  activeTab: AiTab = 'generate';

  readonly tabs: { id: AiTab; label: string; premium?: boolean }[] = [
    { id: 'generate',  label: 'Generate' },
    { id: 'improve',   label: 'Improve',   premium: true },
    { id: 'ats',       label: 'ATS Check' },
    { id: 'translate', label: 'Translate', premium: true },
    { id: 'history',   label: 'History',   premium: true },
  ];

  get isPremium(): boolean { return this.auth.getCurrentPlan() === 'PREMIUM'; }

  ngOnInit(): void {}
}

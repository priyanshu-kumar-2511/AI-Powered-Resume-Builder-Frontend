import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { BuilderStateService } from '../services/builder-state.service';
import { SectionApiService } from '../services/section-api.service';
import { AutoSaveService } from '../services/auto-save.service';
import { LivePreviewService } from '../services/live-preview.service';
import { TemplateService } from '../../../core/services/template.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { SectionListComponent } from '../section-list/section-list.component';
import { SectionEditorComponent } from '../section-editor/section-editor.component';
import { AddSectionComponent } from '../add-section/add-section.component';
import { BuilderToolbarComponent } from '../toolbar/builder-toolbar.component';
import { LivePreviewComponent } from '../preview/live-preview.component';
import { AiSidebarComponent } from '../../ai/sidebar/ai-sidebar.component';
import { ResumeSection } from '../../../shared/models/models';

@Component({
  selector: 'app-builder-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavbarComponent,
    SectionListComponent,
    SectionEditorComponent,
    AddSectionComponent,
    BuilderToolbarComponent,
    LivePreviewComponent,
    AiSidebarComponent
  ],
  templateUrl: './builder-layout.component.html'
})
export class BuilderLayoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sectionApi = inject(SectionApiService);
  private resumeApi = inject(ResumeApiService);
  private templateService = inject(TemplateService);
  readonly builderState = inject(BuilderStateService);
  readonly autoSave = inject(AutoSaveService);
  private livePreview = inject(LivePreviewService);
  private destroy$ = new Subject<void>();

  readonly resumeId = Number(this.route.snapshot.paramMap.get('resumeId'));

  selectedSection: ResumeSection | null = null;
  showAddSection = false;
  showSectionList = true;
  loading = true;
  error = '';
  currentJobTitle = '';

  get selectedSectionContentForAi(): string {
    return this.selectedSection ? this.stringifySectionForAi(this.selectedSection) : '';
  }

  get fullResumeContentForAi(): string {
    const resume = this.builderState.resumeSnapshot;
    const sections = this.builderState.sectionsSnapshot
      .filter(section => section.isVisible)
      .sort((left, right) => left.displayOrder - right.displayOrder);

    const body = sections
      .map(section => `${section.title}\n${this.stringifySectionForAi(section)}`)
      .filter(Boolean)
      .join('\n\n');

    return [
      resume?.title ? `Resume Title: ${resume.title}` : '',
      resume?.targetJobTitle ? `Target Job Title: ${resume.targetJobTitle}` : '',
      body
    ].filter(Boolean).join('\n\n');
  }

  ngOnInit(): void {
    if (!Number.isFinite(this.resumeId) || this.resumeId <= 0) {
      this.error = 'Invalid resume link. Please go back and try again.';
      this.loading = false;
      return;
    }
    this.builderState.reset();
    this.loadResumeAndSections();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.builderState.reset();
  }

  /**
   * Load resume first, then sections sequentially.
   * Previously both were fired in parallel — sections could return [] if the
   * backend hadn't finished committing them by the time the GET fired.
   */
  private loadResumeAndSections(): void {
    this.loading = true;

    this.resumeApi.getById(this.resumeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: resume => {
          this.builderState.setResume(resume);
          this.currentJobTitle = resume.targetJobTitle ?? '';

          if (resume.templateId) {
            this.templateService.getTemplateById(resume.templateId)
              .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
              .subscribe(template => this.builderState.setTemplate(template));
          }

          // Load sections only after resume is confirmed to exist
          this.sectionApi.getSections(this.resumeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: sections => {
                this.builderState.setSections(sections);
                this.loading = false;
              },
              error: () => {
                this.error = 'Could not load sections. Please refresh the page.';
                this.loading = false;
              }
            });
        },
        error: () => {
          this.error = 'Resume not found or you do not have access. Please go back.';
          this.loading = false;
        }
      });
  }

  onSectionSelect(section: ResumeSection): void {
    this.selectedSection = section;
    this.showAddSection = false;
  }

  onSectionAdded(section: ResumeSection): void {
    this.showAddSection = false;
    this.selectedSection = section;
  }

  onSectionDeleted(sectionId: number): void {
    if (this.selectedSection?.sectionId === sectionId) {
      this.selectedSection = null;
    }
  }

  openAddSection(): void {
    this.showAddSection = true;
    this.showSectionList = true;
    this.selectedSection = null;
  }

  closeAddSection(): void {
    this.showAddSection = false;
  }

  clearSection(): void {
    this.selectedSection = null;
  }

  onCanvasClick(): void {
    // intentional — future: deselect on backdrop click
  }

  onSectionClickFromPreview(sectionType: string): void {
    this.builderState.sections$.pipe(takeUntil(this.destroy$))
      .subscribe(sections => {
        const found = sections.find(section => section.sectionType === sectionType);
        if (found) {
          this.selectedSection = found;
          this.showAddSection = false;
        }
      })
      .unsubscribe();
  }

  onSummaryAccepted(text: string): void {
    const summary = this.builderState.sectionsSnapshot.find(section => section.sectionType === 'SUMMARY');
    if (!summary) { return; }

    const content = JSON.stringify({ text });
    this.sectionApi.updateSection(summary.sectionId, { content })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        this.builderState.updateSection(updated);
        this.selectedSection = updated;
      });
  }

  onBulletAccepted(bullet: string): void {
    const target = this.selectedSection?.sectionType === 'EXPERIENCE'
      ? this.selectedSection
      : this.builderState.sectionsSnapshot.find(section => section.sectionType === 'EXPERIENCE');
    if (!target) { return; }

    let data: any[] = [];
    try { data = JSON.parse(target.content || '[]'); } catch { data = []; }
    if (!Array.isArray(data) || data.length === 0) {
      data = [{ company: '', role: '', startDate: '', endDate: '', isCurrent: false, bullets: [bullet] }];
    } else {
      const last = { ...data[data.length - 1] };
      last.bullets = [...(last.bullets || []), bullet];
      data[data.length - 1] = last;
    }

    this.sectionApi.updateSection(target.sectionId, { content: JSON.stringify(data) })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        this.builderState.updateSection(updated);
        this.selectedSection = updated;
      });
  }

  onSkillAdded(skill: string): void {
    const skillsSection = this.builderState.sectionsSnapshot.find(section => section.sectionType === 'SKILLS');
    if (!skillsSection) { return; }

    let skills: string[] = [];
    try {
      const parsed = JSON.parse(skillsSection.content || '[]');
      if (Array.isArray(parsed)) {
        skills = parsed.map(String);
      } else if (parsed && typeof parsed === 'object') {
        skills = Object.values(parsed as Record<string, unknown>)
          .flatMap(value => Array.isArray(value) ? value.map(String) : []);
      }
    } catch {
      skills = [];
    }

    if (!skills.includes(skill)) {
      skills.push(skill);
    }

    this.sectionApi.updateSection(skillsSection.sectionId, { content: JSON.stringify(skills) })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => this.builderState.updateSection(updated));
  }

  onImprovedContent(text: string): void {
    if (!this.selectedSection) { return; }
    const content = this.serializeImprovedSection(this.selectedSection, text);
    if (content === null) { return; }

    this.sectionApi.updateSection(this.selectedSection.sectionId, { content })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        this.builderState.updateSection(updated);
        this.selectedSection = updated;
      });
  }

  onAtsScore(score: number): void {
    console.log('[AI] ATS score received:', score);
  }

  private stringifySectionForAi(section: ResumeSection): string {
    let parsed: unknown;
    try {
      parsed = JSON.parse(section.content || 'null');
    } catch {
      return section.content || '';
    }

    switch (section.sectionType) {
      case 'SUMMARY':
        return typeof parsed === 'object' && parsed !== null ? String((parsed as { text?: string }).text ?? '') : '';
      case 'EXPERIENCE':
        return Array.isArray(parsed)
          ? parsed.map((entry: any) => {
              const header = [entry.role, entry.company].filter(Boolean).join(' at ');
              const bullets = Array.isArray(entry.bullets)
                ? entry.bullets.map((item: string) => `- ${item}`).join('\n')
                : '';
              return [header, bullets].filter(Boolean).join('\n');
            }).join('\n\n')
          : '';
      case 'EDUCATION':
        return Array.isArray(parsed)
          ? parsed.map((entry: any) => [entry.degree, entry.fieldOfStudy, entry.institution].filter(Boolean).join(' - ')).join('\n')
          : '';
      case 'SKILLS':
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed as Record<string, unknown>)
            .flatMap(value => Array.isArray(value) ? value.map(String) : [])
            .join(', ');
        }
        return '';
      default:
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as { text?: string; html?: string };
          return obj.text ?? obj.html ?? '';
        }
        return typeof parsed === 'string' ? parsed : '';
    }
  }

  private serializeImprovedSection(section: ResumeSection, text: string): string | null {
    switch (section.sectionType) {
      case 'SUMMARY':
        return JSON.stringify({ text });
      case 'SKILLS':
        return JSON.stringify(
          text.split(/\r?\n|,/)
            .map(skill => skill.trim())
            .filter(Boolean)
        );
      case 'PROJECTS':
      case 'CERTIFICATIONS':
      case 'LANGUAGES':
      case 'VOLUNTEER':
      case 'CUSTOM':
        return JSON.stringify({ text });
      default:
        return null;
    }
  }
}

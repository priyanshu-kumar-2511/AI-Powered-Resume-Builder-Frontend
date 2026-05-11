import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { BuilderStateService } from '../services/builder-state.service';
import { SectionApiService } from '../services/section-api.service';
import { AutoSaveService } from '../services/auto-save.service';
import { LivePreviewService } from '../services/live-preview.service';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { ResumeStateService } from '../../resume/services/resume-state.service';
import { SectionListComponent } from '../section-list/section-list.component';
import { SectionEditorComponent } from '../section-editor/section-editor.component';
import { AddSectionComponent } from '../add-section/add-section.component';
import { BuilderToolbarComponent } from '../toolbar/builder-toolbar.component';
import { LivePreviewComponent } from '../preview/live-preview.component';
import { ContactEditorComponent } from '../editors/contact-editor.component';
import { AiSidebarComponent } from '../../ai/sidebar/ai-sidebar.component';
import { TemplateSelectorComponent } from '../template-selector/template-selector.component';
import { AddSectionRequest, ResumeSection, SectionType, TemplateResponseDTO, UpdateResumeRequest } from '../../../shared/models/models';
import { ExportModalComponent } from '../../export/modal/export-modal.component';

/**
 * Smart Component acting as the core orchestrator for the Resume Builder view.
 * Manages the layout configuration: left sidebar (AI/Sections/Templates) and right canvas (Preview).
 * Handles global events, data fetching, and synchronizes state between child components.
 */
@Component({
  selector: 'app-builder-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SectionListComponent,
    SectionEditorComponent,
    AddSectionComponent,
    BuilderToolbarComponent,
    LivePreviewComponent,
    ContactEditorComponent,
    AiSidebarComponent,
    ExportModalComponent,
    TemplateSelectorComponent,
  ],
  templateUrl: './builder-layout.component.html'
})
export class BuilderLayoutComponent implements OnInit, OnDestroy {
  readonly colorPresets = ['#00d4b4', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#1e293b'];
  private focusedTextField: HTMLInputElement | HTMLTextAreaElement | null = null;

  private route = inject(ActivatedRoute);
  private sectionApi = inject(SectionApiService);
  private resumeApi = inject(ResumeApiService);
  private resumeState = inject(ResumeStateService);
  private templateService = inject(TemplateService);
  private auth = inject(AuthService);
  readonly builderState = inject(BuilderStateService);
  readonly autoSave = inject(AutoSaveService);
  private livePreview = inject(LivePreviewService);
  private destroy$ = new Subject<void>();

  readonly resumeId = Number(this.route.snapshot.paramMap.get('resumeId'));

  selectedSection: ResumeSection | null = null;
  editingContact = false;
  showAddSection = false;
  showSectionList = true;
  showTemplates = false;
  loading = true;
  error = '';
  currentJobTitle = '';

  // Export modal flag
  showExportModal = false;

  // ── Font controls (wired to BuilderStateService) ──────────────────────────

  get currentFont() { return this.builderState.fontSnapshot; }

  increaseFontSize(): void { this.builderState.increaseFontSize(); }
  decreaseFontSize(): void { this.builderState.decreaseFontSize(); }

  onFontSizeChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.builderState.setFontSize(val);
  }

  onFontFamilyChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.builderState.setFontFamily(val);
  }

  onPrimaryColorChange(color: string): void {
    this.builderState.setPrimaryColor(color);
  }

  captureFocusedField(event: FocusEvent): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
      this.focusedTextField = target;
    }
  }

  applyInlineFormat(prefix: string, suffix = prefix): void {
    const field = this.focusedTextField;
    if (!field || typeof field.selectionStart !== 'number' || typeof field.selectionEnd !== 'number') {
      return;
    }

    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = field.value.slice(start, end) || 'text';
    const nextValue = `${field.value.slice(0, start)}${prefix}${selected}${suffix}${field.value.slice(end)}`;

    field.value = nextValue;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();

    const selectionStart = start + prefix.length;
    field.setSelectionRange(selectionStart, selectionStart + selected.length);
  }

  // ── AI content getters ────────────────────────────────────────────────────

  get selectedSectionContentForAi(): string {
    return this.selectedSection ? this.stringifySectionForAi(this.selectedSection) : '';
  }

  get fullResumeContentForAi(): string {
    const resume = this.builderState.resumeSnapshot;
    const sections = this.builderState.sectionsSnapshot
      .filter(s => s.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const body = sections
      .map(s => `${s.title}\n${this.stringifySectionForAi(s)}`)
      .filter(Boolean)
      .join('\n\n');

    return [
      resume?.title ? `Resume Title: ${resume.title}` : '',
      resume?.targetJobTitle ? `Target Job Title: ${resume.targetJobTitle}` : '',
      body
    ].filter(Boolean).join('\n\n');
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!Number.isFinite(this.resumeId) || this.resumeId <= 0) {
      this.error = 'Invalid resume link. Please go back and try again.';
      this.loading = false;
      return;
    }
    this.builderState.reset();
    this.auth.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        if (profile) {
          this.builderState.setUserProfile({
            ...profile,
            ...this.loadContactOverrides()
          });
        }
      });
    this.loadResumeAndSections();

    // Listen to font & primary color customization changes and autosave them
    this.builderState.font$
      .pipe(takeUntil(this.destroy$))
      .subscribe(font => {
        const resume = this.builderState.resumeSnapshot;
        if (!resume) return;

        const customizationsJson = JSON.stringify({
          fontSize: font.fontSize,
          fontFamily: font.fontFamily,
          primaryColor: font.primaryColor
        });

        // Only save if it has actually changed from the loaded value to avoid saving on initial load
        if (resume.customizations === customizationsJson) {
          return;
        }

        this.autoSave.queueResumeCustomizations(this.resumeId, customizationsJson);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.builderState.reset();
  }

  /**
   * Fetches the core resume metadata and its associated sections from the backend.
   * If a template ID is present, it also triggers a parallel load of the template HTML/CSS.
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

          this.sectionApi.getSections(this.resumeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: sections => { this.builderState.setSections(sections); this.loading = false; },
              error: () => { this.error = 'Could not load sections. Please refresh.'; this.loading = false; }
            });
        },
        error: () => {
          this.error = 'Resume not found or you do not have access.';
          this.loading = false;
        }
      });
  }

  // ── Section event handlers ────────────────────────────────────────────────

  onSectionSelect(section: ResumeSection): void {
    this.selectedSection = section;
    this.editingContact = false;
    this.showAddSection = false;
  }

  onSectionAdded(section: ResumeSection): void {
    this.showAddSection = false;
    this.selectedSection = section;
  }

  onSectionDeleted(sectionId: number): void {
    if (this.selectedSection?.sectionId === sectionId) this.selectedSection = null;
  }

  openAddSection(): void {
    this.showAddSection = true;
    this.showSectionList = true;
    this.showTemplates = false;
    this.selectedSection = null;
    this.editingContact = false;
  }

  closeAddSection(): void { this.showAddSection = false; }
  clearSection(): void {
    this.selectedSection = null;
    this.editingContact = false;
  }
  onCanvasClick(): void { }

  toggleSectionPanel(): void {
    this.showSectionList = !this.showSectionList;
    if (!this.showSectionList) this.showAddSection = false;
    this.showTemplates = false;
  }

  toggleTemplatePanel(): void {
    this.showTemplates = !this.showTemplates;
    if (this.showTemplates) {
      this.showSectionList = false;
      this.showAddSection = false;
    }
  }

  /**
   * Handles the selection of a new template.
   * 1. Issues a non-blocking API call to persist the selection to the database.
   * 2. Fetches the full template source code and updates local state.
   * @param t The selected template preview DTO
   */
  onTemplateSelect(t: TemplateResponseDTO): void {
    if (!this.builderState.resumeSnapshot) return;

    // 1. Update backend (non-blocking)
    this.resumeApi.update(this.resumeId, {
      templateId: t.templateId
    } as UpdateResumeRequest).subscribe();

    // 2. Fetch full template details and update state
    this.templateService.getTemplateById(t.templateId).subscribe(fullTemplate => {
      this.builderState.setTemplate(fullTemplate);
    });

    this.showTemplates = false;
  }

  /**
   * Listener for click events originating from inside the Live Preview iframe.
   * Automatically opens the corresponding section editor in the left sidebar.
   * @param sectionType The resolved section type from the iframe DOM
   */
  onSectionClickFromPreview(sectionType: string): void {
    if (sectionType === 'CONTACT') {
      this.selectedSection = null;
      this.editingContact = true;
      return;
    }

    const found = this.builderState.sectionsSnapshot.find((section) => section.sectionType === sectionType);
    if (found) {
      this.selectedSection = found;
      this.editingContact = false;
      this.showAddSection = false;
      return;
    }

    if (this.isCreatableSectionType(sectionType)) {
      this.createMissingSection(sectionType);
    }
  }

  onContactSaved(): void {
    localStorage.setItem(`resumeai_contact_overrides_${this.resumeId}`, JSON.stringify({
      fullName: this.builderState.userProfileSnapshot?.fullName || '',
      email: this.builderState.userProfileSnapshot?.email || '',
      mobileNumber: this.builderState.userProfileSnapshot?.mobileNumber || '',
      location: this.builderState.userProfileSnapshot?.location || '',
      linkedin: this.builderState.userProfileSnapshot?.linkedin || '',
      github: this.builderState.userProfileSnapshot?.github || '',
      website: this.builderState.userProfileSnapshot?.website || ''
    }));
  }

  // ── AI result handlers ────────────────────────────────────────────────────

  onSummaryAccepted(text: string): void {
    const summary = this.builderState.sectionsSnapshot.find(s => s.sectionType === 'SUMMARY');
    if (!summary) return;
    this.sectionApi.updateSection(summary.sectionId, { content: JSON.stringify({ text }) })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => { this.builderState.updateSection(updated); this.selectedSection = updated; });
  }

  onBulletAccepted(bullet: string): void {
    const target = this.selectedSection?.sectionType === 'EXPERIENCE'
      ? this.selectedSection
      : this.builderState.sectionsSnapshot.find(s => s.sectionType === 'EXPERIENCE');
    if (!target) return;

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
      .subscribe(updated => { this.builderState.updateSection(updated); this.selectedSection = updated; });
  }

  onSkillAdded(skill: string): void {
    const skillsSection = this.builderState.sectionsSnapshot.find(s => s.sectionType === 'SKILLS');
    if (!skillsSection) return;
    let skills: string[] = [];
    try {
      const parsed = JSON.parse(skillsSection.content || '[]');
      skills = Array.isArray(parsed) ? parsed.map(String)
        : Object.values(parsed as Record<string, unknown>).flatMap(v => Array.isArray(v) ? v.map(String) : []);
    } catch { skills = []; }
    if (!skills.includes(skill)) skills.push(skill);
    this.sectionApi.updateSection(skillsSection.sectionId, { content: JSON.stringify(skills) })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => this.builderState.updateSection(updated));
  }

  onImprovedContent(text: string): void {
    if (!this.selectedSection) return;
    const content = this.serializeImprovedSection(this.selectedSection, text);
    if (content === null) return;
    this.sectionApi.updateSection(this.selectedSection.sectionId, { content })
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => { this.builderState.updateSection(updated); this.selectedSection = updated; });
  }

  onAtsScore(score: number): void {
    console.log('[AI] ATS score:', score);
    this.resumeApi.updateAtsScore(this.resumeId, score)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updatedResume => {
          this.builderState.setResume(updatedResume);
          this.resumeState.update(updatedResume);
          console.log('[AI] Successfully persisted updated ATS score to DB:', score);
        },
        error: err => {
          console.error('[AI] Failed to persist ATS score to DB:', err);
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private stringifySectionForAi(section: ResumeSection): string {
    let parsed: unknown;
    try { parsed = JSON.parse(section.content || 'null'); } catch { return section.content || ''; }
    switch (section.sectionType) {
      case 'SUMMARY': return typeof parsed === 'object' && parsed !== null ? String((parsed as any).text ?? '') : '';
      case 'EXPERIENCE': return Array.isArray(parsed) ? parsed.map((e: any) => {
        const header = [e.role, e.company].filter(Boolean).join(' at ');
        const bullets = Array.isArray(e.bullets) ? e.bullets.map((b: string) => `- ${b}`).join('\n') : '';
        return [header, bullets].filter(Boolean).join('\n');
      }).join('\n\n') : '';
      case 'EDUCATION': return Array.isArray(parsed) ? parsed.map((e: any) => [e.degree, e.fieldOfStudy, e.institution].filter(Boolean).join(' - ')).join('\n') : '';
      case 'SKILLS':
        if (Array.isArray(parsed)) return parsed.join(', ');
        if (parsed && typeof parsed === 'object') return Object.values(parsed as Record<string, unknown>).flatMap(v => Array.isArray(v) ? v.map(String) : []).join(', ');
        return '';
      default:
        if (parsed && typeof parsed === 'object') { const o = parsed as any; return o.text ?? o.html ?? ''; }
        return typeof parsed === 'string' ? parsed : '';
    }
  }

  private serializeImprovedSection(section: ResumeSection, text: string): string | null {
    switch (section.sectionType) {
      case 'SUMMARY': return JSON.stringify({ text });
      case 'SKILLS': return JSON.stringify(text.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean));
      case 'PROJECTS': case 'CERTIFICATIONS': case 'LANGUAGES': case 'VOLUNTEER': case 'CUSTOM':
        return JSON.stringify({ text });
      default: return null;
    }
  }

  private isCreatableSectionType(sectionType: string): sectionType is SectionType {
    return [
      'SUMMARY',
      'EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'CERTIFICATIONS',
      'PROJECTS',
      'LANGUAGES',
      'VOLUNTEER',
      'CUSTOM'
    ].includes(sectionType);
  }

  private createMissingSection(sectionType: SectionType): void {
    const payload: AddSectionRequest = {
      resumeId: this.resumeId,
      sectionType,
      title: this.defaultSectionTitle(sectionType),
      content: this.defaultSectionContent(sectionType),
      displayOrder: this.builderState.sectionsSnapshot.length
    };

    this.sectionApi.addSection(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (section) => {
          this.builderState.addSection(section);
          this.selectedSection = section;
          this.editingContact = false;
          this.showAddSection = false;
          this.showTemplates = false;
          this.showSectionList = true;
        },
        error: () => {
          this.error = `Could not create the ${sectionType.toLowerCase()} section. Please try again.`;
        }
      });
  }

  private defaultSectionTitle(type: SectionType): string {
    switch (type) {
      case 'SUMMARY': return 'Professional Summary';
      case 'EXPERIENCE': return 'Work Experience';
      case 'EDUCATION': return 'Education';
      case 'SKILLS': return 'Skills';
      case 'CERTIFICATIONS': return 'Certifications';
      case 'PROJECTS': return 'Projects';
      case 'LANGUAGES': return 'Languages';
      case 'VOLUNTEER': return 'Volunteer Work';
      case 'CUSTOM': return 'Additional Information';
    }
  }

  private defaultSectionContent(type: SectionType): string {
    switch (type) {
      case 'SUMMARY':
        return JSON.stringify({ text: '' });
      case 'EXPERIENCE':
      case 'EDUCATION':
      case 'SKILLS':
        return JSON.stringify([]);
      default:
        return JSON.stringify({ text: '' });
    }
  }

  private loadContactOverrides(): Partial<import('../../../shared/models/models').UserProfileResponse> {
    try {
      const raw = localStorage.getItem(`resumeai_contact_overrides_${this.resumeId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}

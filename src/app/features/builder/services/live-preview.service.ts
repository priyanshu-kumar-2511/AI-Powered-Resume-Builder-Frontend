import { Injectable, OnDestroy, inject } from '@angular/core';
import { combineLatest, Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Resume, ResumeSection, Template, UserProfileResponse } from '../../../shared/models/models';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { BuilderStateService } from './builder-state.service';

type PreviewStyle = {
  fontSize: number;
  fontFamily: string;
  primaryColor: string;
};

/**
 * Service responsible for rendering the live resume preview.
 * Listens to state changes across sections, templates, and styling preferences,
 * debounces them, and dynamically writes the compiled HTML into a hidden iframe.
 */
@Injectable({ providedIn: 'root' })
export class LivePreviewService implements OnDestroy {
  private builderState = inject(BuilderStateService);
  private templateRenderer = inject(TemplateRenderService);

  readonly afterRender$ = new Subject<void>();

  private iframeRef: HTMLIFrameElement | null = null;
  private sub: Subscription | null = null;

  /**
   * Registers the target iframe element where the resume will be rendered.
   * Immediately begins listening for state changes to update the iframe content.
   * @param iframe The HTMLIFrameElement to render into
   */
  registerIframe(iframe: HTMLIFrameElement): void {
    this.iframeRef = iframe;
    this.startListening();
  }

  private startListening(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }

    this.sub = combineLatest([
      this.builderState.sections$,
      this.builderState.template$,
      this.builderState.resume$,
      this.builderState.userProfile$,
      this.builderState.font$
    ]).pipe(
      debounceTime(500),
      distinctUntilChanged(([prevSec, prevTpl, prevResume, prevProfile, prevFont], [currSec, currTpl, currResume, currProfile, currFont]) =>
        JSON.stringify(prevSec) === JSON.stringify(currSec) &&
        prevTpl?.templateId === currTpl?.templateId &&
        prevResume?.resumeId === currResume?.resumeId &&
        prevResume?.targetJobTitle === currResume?.targetJobTitle &&
        JSON.stringify(prevProfile) === JSON.stringify(currProfile) &&
        JSON.stringify(prevFont) === JSON.stringify(currFont)
      )
    ).subscribe(([sections, template, resume, profile, font]) => {
      this.renderPreview(sections, template, resume, profile, font);
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  /**
   * Returns a snapshot of the current preview styling preferences.
   */
  getCurrentStyle(): PreviewStyle {
    return this.builderState.fontSnapshot;
  }

  /**
   * Generates the final, static HTML string for the resume without writing it to the iframe.
   * Used heavily by the ExportService to capture the DOM for PDF printing.
   * @param overrides Optional styling overrides (e.g., custom colors for export)
   * @returns The fully compiled HTML string
   */
  getRenderedHtml(overrides?: { primaryColor?: string; fontFamily?: string }): string | null {
    const sections = this.builderState.sectionsSnapshot;
    const template = this.builderState.templateSnapshot;
    const resume = this.builderState.resumeSnapshot;
    const profile = this.builderState.userProfileSnapshot;
    const font = this.builderState.fontSnapshot;

    const mergedFont = {
      fontSize: font.fontSize,
      fontFamily: overrides?.fontFamily ?? font.fontFamily,
      primaryColor: overrides?.primaryColor ?? font.primaryColor
    };

    return this.buildHtml(sections, template, resume, profile, mergedFont, mergedFont.primaryColor) || null;
  }

  private renderPreview(
    sections: ResumeSection[],
    template: Template | null,
    resume: Resume | null,
    profile: UserProfileResponse | null,
    font: PreviewStyle
  ): void {
    if (!this.iframeRef) return;

    const html = this.buildHtml(sections, template, resume, profile, font);
    const doc = this.iframeRef.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
    this.afterRender$.next();
  }

  private buildHtml(
    sections: ResumeSection[],
    template: Template | null,
    resume: Resume | null,
    profile: UserProfileResponse | null,
    font: PreviewStyle,
    primaryColor?: string
  ): string {
    const renderedTemplate = this.templateRenderer.renderDocument(template, {
      sections,
      profile,
      resume,
      font,
      primaryColor: primaryColor ?? font.primaryColor,
      useDemoData: false
    });

    if (renderedTemplate) {
      return renderedTemplate;
    }

    const body = sections.length > 0
      ? this.buildDefaultLayout(sections)
      : this.buildSampleLayout();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${this.defaultCss()}
    :root {
      --font-family: '${font.fontFamily}', sans-serif;
      --font-size: ${font.fontSize}px;
      --primary: ${font.primaryColor};
    }
    body {
      font-family: var(--font-family) !important;
      font-size: var(--font-size) !important;
    }
  </style>
</head>
<body>${body}</body>
</html>`;
  }

  private buildDefaultLayout(sections: ResumeSection[]): string {
    const visible = sections.filter((section) => section.isVisible);
    const content = visible.map((section) => this.renderSection(section)).join('');
    return `<div class="resume-preview">${content}</div>`;
  }

  private buildSampleLayout(): string {
    return `<div class="resume-preview">
      <div class="section summary">
        <h2>Professional Summary</h2>
        <p>Results-driven marketing professional with 8+ years of experience leading cross-functional teams and delivering data-driven campaigns that grow revenue.</p>
      </div>
      <div class="section experience">
        <h2>Work Experience</h2>
        <div class="exp-entry">
          <div class="exp-header">Senior Marketing Manager</div>
          <div class="exp-company">Bonsai Studio</div>
          <div class="exp-dates">Jan 2022 - Present</div>
          <ul><li>Led team of 12 to deliver award-winning campaigns</li><li>Grew organic traffic 60% in 18 months</li></ul>
        </div>
      </div>
      <div class="section skills">
        <h2>Skills</h2>
        <div class="skill-chips">
          <span class="skill-chip">Analytics</span>
          <span class="skill-chip">Strategy</span>
          <span class="skill-chip">SEO/SEM</span>
          <span class="skill-chip">Leadership</span>
        </div>
      </div>
    </div>`;
  }

  private renderSection(section: ResumeSection): string {
    let parsed: unknown;
    try { parsed = JSON.parse(section.content || 'null'); } catch { parsed = null; }

    switch (section.sectionType) {
      case 'SUMMARY':
        return `<div class="section summary"><h2>${section.title}</h2><div class="rich-text">${this.renderRichText(this.extractTextValue(parsed))}</div></div>`;

      case 'EXPERIENCE': {
        const entries: any[] = Array.isArray(parsed) ? parsed : [];
        const items = entries.map((entry) => `
          <div class="exp-entry">
            <div class="exp-header">${entry.role || ''}</div>
            <div class="exp-company">${entry.company || ''}</div>
            <div class="exp-dates">${entry.startDate || ''} - ${entry.isCurrent ? 'Present' : (entry.endDate || '')}</div>
            <ul>${(entry.bullets || []).map((bullet: any) => `<li>${typeof bullet === 'string' ? bullet : bullet.text || ''}</li>`).join('')}</ul>
          </div>`).join('');
        return `<div class="section experience"><h2>${section.title}</h2>${items}</div>`;
      }

      case 'EDUCATION': {
        const entries: any[] = Array.isArray(parsed) ? parsed : [];
        const items = entries.map((entry) => `
          <div class="edu-entry">
            <div>
              <strong>${entry.institution || ''}</strong>
              <div class="edu-degree">${entry.degree || ''}${entry.fieldOfStudy ? ' - ' + entry.fieldOfStudy : ''}</div>
            </div>
            <div class="edu-dates">${entry.startYear || ''} - ${entry.endYear || ''}${entry.grade ? '<br>' + entry.grade : ''}</div>
          </div>`).join('');
        return `<div class="section education"><h2>${section.title}</h2>${items}</div>`;
      }

      case 'SKILLS': {
        let allSkills: string[] = [];
        if (Array.isArray(parsed)) {
          allSkills = parsed.map((skill: any) => typeof skill === 'string' ? skill : skill.name || '');
        } else if (parsed && typeof parsed === 'object') {
          const objectValue = parsed as Record<string, string[]>;
          Object.values(objectValue).forEach((group) => {
            if (Array.isArray(group)) allSkills.push(...group);
          });
        }
        const chips = allSkills.map((skill) => `<span class="skill-chip">${skill}</span>`).join('');
        return `<div class="section skills"><h2>${section.title}</h2><div class="skill-chips">${chips || '<span style="color:#94a3b8;font-size:10px">No skills added yet</span>'}</div></div>`;
      }

      default:
        return `<div class="section generic"><h2>${section.title}</h2><div class="rich-text">${this.renderRichText(this.extractTextValue(parsed))}</div></div>`;
    }
  }

  private extractTextValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record['html'] === 'string') return String(record['html']);
      if (typeof record['text'] === 'string') return String(record['text']);
    }
    return '';
  }

  private renderRichText(value: string): string {
    return this.escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/gs, '<em>$1</em>')
      .replace(/\+\+(.+?)\+\+/gs, '<u>$1</u>')
      .replace(/~~(.+?)~~/gs, '<s>$1</s>')
      .replace(/\r?\n/g, '<br>');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private defaultCss(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&family=Merriweather:wght@700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 11px;
        color: #1a1a2e;
        line-height: 1.55;
        background: #fff;
        -webkit-font-smoothing: antialiased;
      }

      .resume-preview {
        max-width: 100%;
        padding: 40px 44px;
      }

      .resume-header {
        border-bottom: 2px solid var(--primary, #00d4b4);
        padding-bottom: 18px;
        margin-bottom: 24px;
      }
      .resume-name {
        font-family: 'Merriweather', Georgia, serif;
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.3px;
        margin-bottom: 3px;
      }
      .resume-role {
        font-size: 12px;
        font-weight: 600;
        color: var(--primary, #00b89c);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .resume-contact {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        font-size: 10px;
        color: #64748b;
      }
      .resume-contact span {
        display: inline-flex; align-items: center; gap: 3px;
      }

      .section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }

      .section h2 {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--primary, #00b89c);
        border-bottom: 1.5px solid #e2f8f5;
        padding-bottom: 5px;
        margin-bottom: 12px;
        position: relative;
      }
      .section h2::before {
        content: '';
        position: absolute;
        bottom: -1.5px; left: 0;
        width: 28px; height: 1.5px;
        background: var(--primary, #00d4b4);
      }

      .summary p {
      .summary .rich-text {
        font-size: 11px;
        color: #374151;
        line-height: 1.65;
      }

      .rich-text strong { font-weight: 700; }
      .rich-text em { font-style: italic; }
      .rich-text u { text-decoration: underline; }
      .rich-text s { text-decoration: line-through; }

      .exp-entry {
        margin-bottom: 14px;
        padding-left: 10px;
        border-left: 2px solid #e2f8f5;
      }

      .exp-header {
        font-size: 11.5px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 1px;
      }
      .exp-company {
        font-size: 10.5px;
        font-weight: 600;
        color: var(--primary, #00b89c);
        margin-bottom: 2px;
      }
      .exp-dates {
        font-size: 9.5px;
        color: #94a3b8;
        margin-bottom: 6px;
        font-weight: 500;
      }
      .exp-entry ul {
        list-style: none;
        padding: 0;
        display: flex; flex-direction: column; gap: 3px;
      }
      .exp-entry ul li {
        font-size: 10.5px;
        color: #374151;
        padding-left: 12px;
        position: relative;
        line-height: 1.55;
      }
      .exp-entry ul li::before {
        content: '>';
        position: absolute; left: 0;
        color: var(--primary, #00d4b4); font-size: 8px;
        top: 1px;
      }

      .edu-entry {
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .edu-entry strong {
        font-size: 11px; font-weight: 700; color: #0f172a; display: block; margin-bottom: 1px;
      }
      .edu-degree {
        font-size: 10.5px; color: #374151;
      }
      .edu-dates {
        font-size: 9.5px; color: #94a3b8; font-weight: 500;
        white-space: nowrap; margin-top: 2px; text-align: right;
      }

      .skills .skill-chips {
        display: flex; flex-wrap: wrap; gap: 6px;
      }
      .skill-chip {
        background: #f0fdf9;
        border: 1px solid #a7f3e0;
        color: #065f46;
        border-radius: 4px;
        padding: 3px 10px;
        font-size: 9.5px;
        font-weight: 600;
      }

      .generic {
        font-size: 11px; color: #374151; line-height: 1.6;
      }
    `;
  }
}

import { Injectable, inject, OnDestroy } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BuilderStateService } from './builder-state.service';
import { ResumeSection, Template } from '../../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class LivePreviewService implements OnDestroy {
  private builderState = inject(BuilderStateService);

  private iframeRef: HTMLIFrameElement | null = null;
  private sub: Subscription | null = null;

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
      this.builderState.template$
    ]).pipe(
      debounceTime(500),
      distinctUntilChanged(([prevSec, prevTpl], [currSec, currTpl]) =>
        JSON.stringify(prevSec) === JSON.stringify(currSec) &&
        prevTpl?.templateId === currTpl?.templateId
      )
    ).subscribe(([sections, template]) => {
      this.renderPreview(sections, template);
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private renderPreview(sections: ResumeSection[], template: Template | null): void {
    if (!this.iframeRef) return;

    const html = this.buildHtml(sections, template);
    const doc = this.iframeRef.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }

  private buildHtml(sections: ResumeSection[], template: Template | null): string {
    const css = template?.cssStyles || this.defaultCss();
    let body: string;

    if (template?.htmlLayout) {
      if (sections.length > 0) {
        // Fill real section data into template
        body = this.injectSections(template.htmlLayout, sections);
      } else {
        // Fill with sample/placeholder data so template looks great immediately
        body = this.injectPlaceholders(template.htmlLayout);
      }
    } else {
      body = sections.length > 0
        ? this.buildDefaultLayout(sections)
        : this.buildSampleLayout();
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>${body}</body>
</html>`;
  }

  /** Fill template placeholders with sample/demo data */
  private injectPlaceholders(layout: string): string {
    const placeholders: Record<string, string> = {
      '{{fullName}}':      'Richard Sanchez',
      '{{jobTitle}}':      'Marketing Manager',
      '{{email}}':         'rsanchez@email.com',
      '{{phone}}':         '+1 (555) 012-3456',
      '{{location}}':      'New York, NY',
      '{{linkedin}}':      'linkedin.com/in/rsanchez',
      '{{summary}}':       'Results-driven marketing professional with 8+ years of experience leading cross-functional teams. Proven track record of growing revenue by 40% through data-driven campaigns and innovative brand strategies.',
      '{{SUMMARY}}':       '<div class="section summary"><h2>Professional Summary</h2><p>Results-driven marketing professional with 8+ years of experience. Proven track record of growing revenue by 40% through data-driven campaigns.</p></div>',
      '{{EXPERIENCE}}':    '<div class="section experience"><h2>Work Experience</h2><div class="exp-entry"><div class="exp-header">Senior Marketing Manager</div><div class="exp-company">Bonsai Studio</div><div class="exp-dates">Jan 2022 – Present</div><ul><li>Led a team of 12 to deliver award-winning campaigns</li><li>Grew organic traffic by 60% in 18 months</li></ul></div></div>',
      '{{EDUCATION}}':     '<div class="section education"><h2>Education</h2><div class="edu-entry"><div><strong>Stanford University</strong><div class="edu-degree">B.A. Communications</div></div><div class="edu-dates">2014–2018</div></div></div>',
      '{{SKILLS}}':        '<div class="section skills"><h2>Skills</h2><div class="skill-chips"><span class="skill-chip">Analytics</span><span class="skill-chip">Strategy</span><span class="skill-chip">SEO/SEM</span><span class="skill-chip">Adobe Suite</span><span class="skill-chip">Leadership</span></div></div>',
    };
    let result = layout;
    Object.entries(placeholders).forEach(([key, val]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), val);
    });
    return result;
  }

  /** Inject section content into template placeholder comments/divs if present */
  private injectSections(layout: string, sections: ResumeSection[]): string {
    let result = layout;
    sections.forEach(section => {
      const placeholder = `{{${section.sectionType}}}`;
      const rendered = this.renderSection(section);
      result = result.replace(new RegExp(placeholder, 'g'), rendered);
    });
    return result;
  }

  /** Fallback layout when no template or no placeholders matched */
  private buildDefaultLayout(sections: ResumeSection[]): string {
    const visible = sections.filter(s => s.isVisible);
    const content = visible.map(s => this.renderSection(s)).join('');
    return `<div class="resume-preview">${content}</div>`;
  }

  /** Beautiful sample resume shown when builder first opens (no sections yet) */
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
          <div class="exp-dates">Jan 2022 – Present</div>
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
        return `<div class="section summary"><h2>${section.title}</h2><p>${(parsed as any)?.text || ''}</p></div>`;

      case 'EXPERIENCE': {
        const entries: any[] = Array.isArray(parsed) ? parsed : [];
        const items = entries.map(e => `
          <div class="exp-entry">
            <div class="exp-header">${e.role || ''}</div>
            <div class="exp-company">${e.company || ''}</div>
            <div class="exp-dates">${e.startDate || ''} – ${e.isCurrent ? 'Present' : (e.endDate || '')}</div>
            <ul>${(e.bullets || []).map((b: string) => `<li>${b}</li>`).join('')}</ul>
          </div>`).join('');
        return `<div class="section experience"><h2>${section.title}</h2>${items}</div>`;
      }

      case 'EDUCATION': {
        const entries: any[] = Array.isArray(parsed) ? parsed : [];
        const items = entries.map(e => `
          <div class="edu-entry">
            <div>
              <strong>${e.institution || ''}</strong>
              <div class="edu-degree">${e.degree || ''}${e.fieldOfStudy ? ' · ' + e.fieldOfStudy : ''}</div>
            </div>
            <div class="edu-dates">${e.startYear || ''} – ${e.endYear || ''}${e.grade ? '<br>' + e.grade : ''}</div>
          </div>`).join('');
        return `<div class="section education"><h2>${section.title}</h2>${items}</div>`;
      }

      case 'SKILLS': {
        const skills: string[] = Array.isArray(parsed) ? parsed : [];
        const chips = skills.map(s => `<span class="skill-chip">${s}</span>`).join('');
        return `<div class="section skills"><h2>${section.title}</h2><div class="skill-chips">${chips}</div></div>`;
      }

      default:
        return `<div class="section generic"><h2>${section.title}</h2><div>${(parsed as any)?.html || (parsed as any)?.text || ''}</div></div>`;
    }
  }

  private defaultCss(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@700&display=swap');

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

      /* Header — injected by PERSONAL_INFO or first section as fallback */
      .resume-header {
        border-bottom: 2px solid #00d4b4;
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
        color: #00b89c;
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

      /* Sections */
      .section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }

      .section h2 {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #00b89c;
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
        background: #00d4b4;
      }

      /* Summary */
      .summary p {
        font-size: 11px;
        color: #374151;
        line-height: 1.65;
      }

      /* Experience */
      .exp-entry {
        margin-bottom: 14px;
        padding-left: 10px;
        border-left: 2px solid #e2f8f5;
        transition: border-color 0.2s;
      }
      .exp-entry:hover { border-left-color: #00d4b4; }

      .exp-header {
        font-size: 11.5px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 1px;
      }
      .exp-company {
        font-size: 10.5px;
        font-weight: 600;
        color: #00b89c;
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
        content: '▸';
        position: absolute; left: 0;
        color: #00d4b4; font-size: 8px;
        top: 1px;
      }

      /* Education */
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

      /* Skills */
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

      /* Generic */
      .generic {
        font-size: 11px; color: #374151; line-height: 1.6;
      }
    `;
  }
}

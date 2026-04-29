import { Injectable, inject, OnDestroy } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BuilderStateService } from './builder-state.service';
import { ResumeSection, Template } from '../../../shared/models/models';
import { AuthService } from '../../../core/services/auth.service';

// ✅ FIX: mustache uses `export default` in its ESM build.
// `import * as Mustache` gives a namespace object where .render is undefined.
// Use a default import instead.
import Mustache from 'mustache';

@Injectable({ providedIn: 'root' })
export class LivePreviewService implements OnDestroy {
  private builderState = inject(BuilderStateService);
  private authService = inject(AuthService);

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
      this.builderState.template$,
      this.builderState.resume$
    ]).pipe(
      debounceTime(500),
      distinctUntilChanged(([prevSec, prevTpl, prevResume], [currSec, currTpl, currResume]) =>
        JSON.stringify(prevSec) === JSON.stringify(currSec) &&
        prevTpl?.templateId === currTpl?.templateId &&
        prevResume?.resumeId === currResume?.resumeId &&
        prevResume?.targetJobTitle === currResume?.targetJobTitle
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
        body = this.injectSections(template.htmlLayout, sections);
      } else {
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
    const viewData = {
      fullName: 'Richard Sanchez',
      jobTitle: 'Marketing Manager',
      email: 'rsanchez@email.com',
      phone: '+1 (555) 012-3456',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/rsanchez',
      summary: 'Results-driven marketing professional with 8+ years of experience leading cross-functional teams. Proven track record of growing revenue by 40% through data-driven campaigns and innovative brand strategies.',
      experience: [
        {
          role: 'Senior Marketing Manager',
          company: 'Bonsai Studio',
          startDate: 'Jan 2022',
          endDate: 'Present',
          bullets: [{ text: 'Led a team of 12 to deliver award-winning campaigns' }, { text: 'Grew organic traffic by 60% in 18 months' }]
        }
      ],
      education: [
        {
          degree: 'B.A. Communications',
          institution: 'Stanford University',
          startYear: '2014',
          endYear: '2018',
          grade: '3.8 GPA'
        }
      ],
      skills: [{ name: 'Analytics' }, { name: 'Strategy' }, { name: 'SEO/SEM' }, { name: 'Leadership' }]
    };
    // ✅ Mustache.render now works correctly with the default import
    return Mustache.render(layout, viewData);
  }

  /** Inject real section content into template placeholders */
  private injectSections(layout: string, sections: ResumeSection[]): string {
    const currentUser = this.authService.currentUser();
    const currentResume = this.builderState.resumeSnapshot;

    const viewData: any = {
      fullName: currentUser?.fullName ?? 'Your Name',
      jobTitle: currentResume?.targetJobTitle ?? 'Target Role',
      email: currentUser?.email ?? '',
      phone: currentUser?.mobileNumber ?? '',
      location: '',
      linkedin: '',
      website: ''
    };

    sections.forEach(section => {
      if (!section.isVisible) return;
      let parsed = null;
      try { parsed = JSON.parse(section.content || 'null'); } catch (e) { }

      if (section.sectionType === 'SUMMARY') {
        viewData.summary = parsed?.text || '';
      } else if (section.sectionType === 'SKILLS') {
        let allSkills: { name: string }[] = [];
        if (Array.isArray(parsed)) {
          allSkills = parsed.map((s: any) => typeof s === 'string' ? { name: s } : s);
        } else if (parsed && typeof parsed === 'object') {
          Object.values(parsed as Record<string, string[]>).forEach(arr => {
            if (Array.isArray(arr)) {
              allSkills.push(...arr.map((s: any) => typeof s === 'string' ? { name: s } : s));
            }
          });
        }
        viewData.skills = allSkills;
      } else if (section.sectionType === 'EXPERIENCE' || section.sectionType === 'PROJECTS') {
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (Array.isArray(item.bullets)) {
              item.bullets = item.bullets.map((b: any) => typeof b === 'string' ? { text: b } : b);
            }
          });
        }
        viewData[section.sectionType.toLowerCase()] = parsed;
      } else if (section.sectionType === 'EDUCATION') {
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (Array.isArray(item.highlights)) {
              item.highlights = item.highlights.map((h: any) => typeof h === 'string' ? { text: h } : h);
            }
          });
        }
        viewData[section.sectionType.toLowerCase()] = parsed;
      } else {
        viewData[section.sectionType.toLowerCase()] = parsed;
      }
    });

    // ✅ Mustache.render now works correctly with the default import
    return Mustache.render(layout, viewData);
  }

  /** Fallback layout when no template */
  private buildDefaultLayout(sections: ResumeSection[]): string {
    const visible = sections.filter(s => s.isVisible);
    const content = visible.map(s => this.renderSection(s)).join('');
    return `<div class="resume-preview">${content}</div>`;
  }

  /** Sample resume shown when builder first opens with no sections */
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
            <ul>${(e.bullets || []).map((b: any) => `<li>${typeof b === 'string' ? b : b.text || ''}</li>`).join('')}</ul>
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
        let allSkills: string[] = [];
        if (Array.isArray(parsed)) {
          allSkills = parsed.map((s: any) => typeof s === 'string' ? s : s.name || '');
        } else if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, string[]>;
          Object.values(obj).forEach(arr => {
            if (Array.isArray(arr)) allSkills.push(...arr);
          });
        }
        const chips = allSkills.map(s => `<span class="skill-chip">${s}</span>`).join('');
        return `<div class="section skills"><h2>${section.title}</h2><div class="skill-chips">${chips || '<span style="color:#94a3b8;font-size:10px">No skills added yet</span>'}</div></div>`;
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

      .summary p {
        font-size: 11px;
        color: #374151;
        line-height: 1.65;
      }

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
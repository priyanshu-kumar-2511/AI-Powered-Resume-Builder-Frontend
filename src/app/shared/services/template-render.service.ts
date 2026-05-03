import { Injectable } from '@angular/core';
import Mustache from 'mustache';
import { Resume, ResumeSection, Template, UserProfileResponse } from '../models/models';
import { resolveTemplateFallback } from '../data/template-fallbacks';

type PreviewFont = {
  fontSize: number;
  fontFamily: string;
};

type PreviewSkill = { name: string };
type PreviewBullet = { text: string };
type PreviewExperience = {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: PreviewBullet[];
};
type PreviewEducation = {
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  grade: string;
  description: string;
  highlights: PreviewBullet[];
};
type PreviewProject = {
  title: string;
  dates: string;
  bullets: PreviewBullet[];
};
type PreviewCertification = {
  name: string;
  date: string;
};
type PreviewKeyValue = {
  label: string;
  value: string;
};
type PreviewReference = {
  name: string;
  title: string;
  phone: string;
  social: string;
};
type PreviewAchievement = {
  title: string;
  description: string;
};

type TemplateViewData = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: PreviewSkill[];
  softSkills: PreviewSkill[];
  expertise: PreviewSkill[];
  experience: PreviewExperience[];
  education: PreviewEducation[];
  projects: PreviewProject[];
  certifications: PreviewCertification[];
  achievements: PreviewAchievement[];
  additionalInfo: PreviewKeyValue[];
  references: PreviewReference[];
  awards: PreviewSkill[];
};

@Injectable({ providedIn: 'root' })
export class TemplateRenderService {
  private readonly demoData: TemplateViewData = {
    fullName: 'Lorna Alvarado',
    jobTitle: 'Marketing Manager',
    email: 'hello@reallygreatsite.com',
    phone: '+123-456-7890',
    location: '123 Anywhere St., Any City',
    linkedin: 'linkedin.com/in/lornaalvarado',
    github: 'github.com/lornaalvarado',
    website: 'www.reallygreatsite.com',
    summary: 'Creative and detail-oriented marketing professional with 8+ years of experience building campaigns, improving conversion funnels, and mentoring cross-functional teams across digital channels.',
    skills: [
      { name: 'Project Management' },
      { name: 'Public Relations' },
      { name: 'Teamwork' },
      { name: 'Leadership' },
      { name: 'Time Management' },
      { name: 'Effective Communication' }
    ],
    softSkills: [
      { name: 'Leadership' },
      { name: 'Collaboration' },
      { name: 'Communication' }
    ],
    expertise: [
      { name: 'Brand Strategy' },
      { name: 'Campaign Planning' },
      { name: 'Market Research' },
      { name: 'Content Marketing' },
      { name: 'Budget Management' },
      { name: 'Analytics' }
    ],
    experience: [
      {
        role: 'Senior Marketing Manager',
        company: 'Wardiere Inc.',
        startDate: '2030',
        endDate: 'Present',
        description: 'Built integrated marketing campaigns, improved reporting visibility, and scaled qualified pipeline growth across paid and owned channels.',
        bullets: [
          { text: 'Led a team of 8 marketers across lifecycle, content, and growth initiatives.' },
          { text: 'Improved lead-to-opportunity conversion by 42% through funnel optimization.' },
          { text: 'Partnered with product and sales teams to launch 4 high-performing campaigns.' }
        ]
      },
      {
        role: 'Marketing Manager',
        company: 'Studio Showde',
        startDate: '2027',
        endDate: '2030',
        description: 'Managed campaign execution, content systems, and stakeholder reporting for B2B demand generation programs.',
        bullets: [
          { text: 'Owned quarterly campaign planning and managed a six-figure media budget.' },
          { text: 'Created executive dashboards for CAC, MQL quality, and retention signals.' }
        ]
      }
    ],
    education: [
      {
        degree: 'Master of Strategic Marketing',
        institution: 'Wardiere University',
        startYear: '2029',
        endYear: '2030',
        grade: 'GPA: 3.8 / 4.0',
        description: 'Specialized in performance marketing, growth experimentation, and customer insights.',
        highlights: [
          { text: 'Capstone focused on lifecycle retention strategy for subscription products.' }
        ]
      },
      {
        degree: 'Bachelor of Strategic Marketing',
        institution: 'Wardiere University',
        startYear: '2025',
        endYear: '2029',
        grade: 'GPA: 3.8 / 4.0',
        description: 'Studied brand communication, analytics, and digital media strategy.',
        highlights: [
          { text: 'Graduated with distinction and led the student marketing association.' }
        ]
      }
    ],
    projects: [
      {
        title: 'Demand Generation Revamp',
        dates: '2029 - 2030',
        bullets: [
          { text: 'Redesigned nurture flows and increased qualified demo requests by 31%.' },
          { text: 'Introduced attribution reporting that reduced campaign waste across channels.' }
        ]
      }
    ],
    certifications: [
      { name: 'Google Ads Search Certification', date: '2029' },
      { name: 'HubSpot Content Marketing', date: '2028' }
    ],
    achievements: [
      { title: 'Revenue Growth', description: 'Improved marketing-sourced pipeline by 42% in 12 months.' },
      { title: 'Team Award', description: 'Led a cross-functional launch that won regional campaign honors.' }
    ],
    additionalInfo: [
      { label: 'Languages', value: 'English (Native), Spanish (Professional)' },
      { label: 'Portfolio', value: 'www.reallygreatsite.com' }
    ],
    references: [
      {
        name: 'Harper Russo',
        title: 'CEO, Wardiere Inc.',
        phone: '123-456-7890',
        social: 'linkedin.com/in/harperrusso'
      }
    ],
    awards: [
      { name: 'Marketing Excellence Award' },
      { name: 'Top Campaign Leader' }
    ]
  };

  renderDocument(
    template: Template | null | undefined,
    options?: {
      sections?: ResumeSection[];
      profile?: UserProfileResponse | null;
      resume?: Resume | null;
      font?: PreviewFont;
      primaryColor?: string;
    }
  ): string | null {
    const layout = this.getLayout(template);
    if (!layout) {
      return null;
    }

    const styles = this.getStyles(template);
    const viewData = this.buildViewData(
      options?.sections ?? [],
      options?.profile ?? null,
      options?.resume ?? null
    );

    let renderedBody = layout;
    try {
      renderedBody = Mustache.render(layout, viewData);
    } catch (error) {
      console.error('[TemplateRender] Mustache render failed:', error);
    }

    const fontCss = options?.font
      ? `
    :root {
      --preview-font-family: '${options.font.fontFamily}', sans-serif;
      --preview-font-size: ${options.font.fontSize}px;
    }
    body {
      font-family: var(--preview-font-family) !important;
      font-size: var(--preview-font-size) !important;
    }`
      : '';

    const bodyAttrs = options?.primaryColor
      ? ` style="--primary: ${options.primaryColor}; --accent: ${options.primaryColor}; --color-primary: ${options.primaryColor};"`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${styles}
    ${fontCss}
  </style>
</head>
<body${bodyAttrs}>${renderedBody}</body>
</html>`;
  }

  buildViewData(
    sections: ResumeSection[] = [],
    profile: UserProfileResponse | null = null,
    resume: Resume | null = null
  ): TemplateViewData {
    const viewData = this.cloneDemoData();

    if (this.hasText(profile?.fullName)) viewData.fullName = profile!.fullName.trim();
    if (this.hasText(profile?.email)) viewData.email = profile!.email.trim();
    if (this.hasText(profile?.mobileNumber)) viewData.phone = profile!.mobileNumber.trim();
    if (this.hasText(profile?.location)) viewData.location = profile!.location!.trim();
    if (this.hasText(profile?.linkedin)) viewData.linkedin = profile!.linkedin!.trim();
    if (this.hasText(profile?.github)) viewData.github = profile!.github!.trim();
    if (this.hasText(profile?.website)) viewData.website = profile!.website!.trim();
    if (this.hasText(resume?.targetJobTitle)) viewData.jobTitle = resume!.targetJobTitle.trim();

    const actualSkills: string[] = [];
    const actualExperience: PreviewExperience[] = [];
    const actualEducation: PreviewEducation[] = [];
    const actualProjects: PreviewProject[] = [];
    const actualCertifications: PreviewCertification[] = [];
    const actualAchievements: PreviewAchievement[] = [];
    const actualAdditionalInfo: PreviewKeyValue[] = [];

    sections.forEach((section) => {
      if (!section.isVisible) {
        return;
      }

      const parsed = this.parseContent(section.content);

      switch (section.sectionType) {
        case 'SUMMARY': {
          const summary = this.extractTextValue(parsed);
          if (this.hasText(summary)) {
            viewData.summary = this.renderRichText(summary.trim());
          }
          break;
        }
        case 'SKILLS': {
          actualSkills.push(...this.extractSkills(parsed));
          break;
        }
        case 'EXPERIENCE': {
          actualExperience.push(...this.extractExperience(parsed));
          break;
        }
        case 'EDUCATION': {
          actualEducation.push(...this.extractEducation(parsed));
          break;
        }
        case 'PROJECTS': {
          actualProjects.push(...this.extractProjects(parsed));
          break;
        }
        case 'CERTIFICATIONS': {
          actualCertifications.push(...this.extractCertifications(parsed));
          break;
        }
        case 'LANGUAGES': {
          const languages = this.extractLineItems(parsed);
          if (languages.length) {
            actualAdditionalInfo.push({
              label: 'Languages',
              value: languages.join(', ')
            });
          }
          break;
        }
        case 'VOLUNTEER':
        case 'CUSTOM': {
          const text = this.extractTextValue(parsed);
          if (this.hasText(text)) {
            actualAdditionalInfo.push({
              label: section.title,
              value: text.trim()
            });
          }
          break;
        }
      }
    });

    if (actualExperience.length) {
      viewData.experience = actualExperience;
      if (!actualAchievements.length) {
        viewData.achievements = actualExperience.slice(0, 2).map((item) => ({
          title: item.role || item.company || 'Impact',
          description: item.description || item.bullets.map((bullet) => bullet.text).join(' ')
        })).filter((item) => this.hasText(item.description));
      }
    }

    if (actualEducation.length) viewData.education = actualEducation;
    if (actualProjects.length) viewData.projects = actualProjects;
    if (actualCertifications.length) {
      viewData.certifications = actualCertifications;
      viewData.awards = actualCertifications.slice(0, 3).map((item) => ({ name: item.name }));
    }
    if (actualAchievements.length) viewData.achievements = actualAchievements;

    if (actualAdditionalInfo.length) {
      const merged = [...viewData.additionalInfo];
      actualAdditionalInfo.forEach((item) => {
        const existing = merged.findIndex((entry) => entry.label.toLowerCase() === item.label.toLowerCase());
        if (existing >= 0) merged[existing] = item;
        else merged.push(item);
      });
      viewData.additionalInfo = merged;
    }

    const uniqueSkills = Array.from(
      new Set(actualSkills.map((skill) => skill.trim()).filter((skill) => skill.length > 0))
    );

    if (uniqueSkills.length) {
      const skillItems = uniqueSkills.map((name) => ({ name }));
      viewData.skills = skillItems;
      viewData.expertise = skillItems.slice(0, 6);
      viewData.softSkills = skillItems.slice(-3);
    }

    return viewData;
  }

  private getLayout(template: Template | null | undefined): string {
    const directLayout = template?.htmlLayout || (template as Record<string, string> | null | undefined)?.['html_layout'] || '';
    if (directLayout) {
      return directLayout;
    }

    return resolveTemplateFallback(template)?.htmlLayout || '';
  }

  private getStyles(template: Template | null | undefined): string {
    const directStyles = template?.cssStyles || (template as Record<string, string> | null | undefined)?.['css_styles'] || '';
    if (directStyles) {
      return directStyles;
    }

    return resolveTemplateFallback(template)?.cssStyles || '';
  }

  private cloneDemoData(): TemplateViewData {
    return JSON.parse(JSON.stringify(this.demoData)) as TemplateViewData;
  }

  private parseContent(content: string | null | undefined): unknown {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  private extractTextValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record['text'] === 'string') return record['text'];
      if (typeof record['html'] === 'string') return record['html'];
      if (typeof record['description'] === 'string') return record['description'];
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

  private extractSkills(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && typeof (item as Record<string, unknown>)['name'] === 'string') {
            return String((item as Record<string, unknown>)['name']);
          }
          return '';
        })
        .filter((item) => this.hasText(item));
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap((entry) => {
        if (!Array.isArray(entry)) return [];
        return entry.map((item) => String(item)).filter((item) => this.hasText(item));
      });
    }

    return [];
  }

  private extractExperience(value: unknown): PreviewExperience[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry) => {
        const item = (entry ?? {}) as Record<string, unknown>;
        const bullets = this.extractBullets(item['bullets']);
        const description = this.firstText(
          item['description'],
          item['summary'],
          bullets.map((bullet) => bullet.text).join(' ')
        );

        return {
          role: this.stringValue(item['role']),
          company: this.stringValue(item['company']),
          startDate: this.stringValue(item['startDate']),
          endDate: item['isCurrent'] ? 'Present' : this.stringValue(item['endDate']),
          description,
          bullets: bullets.length ? bullets : [{ text: description }]
        };
      })
      .filter((item) => this.hasText(item.role) || this.hasText(item.company) || item.bullets.length > 0);
  }

  private extractEducation(value: unknown): PreviewEducation[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry) => {
        const item = (entry ?? {}) as Record<string, unknown>;
        const highlights = this.extractBullets(item['highlights']);
        const description = this.firstText(
          item['description'],
          item['fieldOfStudy'],
          item['grade'],
          highlights.map((highlight) => highlight.text).join(' ')
        );

        const finalHighlights = highlights.length
          ? highlights
          : description
            ? [{ text: description }]
            : [];

        return {
          degree: this.stringValue(item['degree']),
          institution: this.stringValue(item['institution']),
          startYear: this.stringValue(item['startYear']),
          endYear: this.stringValue(item['endYear']),
          grade: this.stringValue(item['grade']),
          description,
          highlights: finalHighlights
        };
      })
      .filter((item) => this.hasText(item.degree) || this.hasText(item.institution));
  }

  private extractProjects(value: unknown): PreviewProject[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          const item = (entry ?? {}) as Record<string, unknown>;
          const bullets = this.extractBullets(item['bullets']);
          const title = this.firstText(item['title'], item['name'], item['role'], 'Project');
          const startDate = this.stringValue(item['startDate']);
          const endDate = item['isCurrent'] ? 'Present' : this.stringValue(item['endDate']);
          const dates = this.firstText(item['dates'], [startDate, endDate].filter(Boolean).join(' - '));
          const description = this.firstText(item['description'], this.extractTextValue(item));

          return {
            title,
            dates,
            bullets: bullets.length ? bullets : description ? [{ text: description }] : []
          };
        })
        .filter((item) => this.hasText(item.title) || item.bullets.length > 0);
    }

    const text = this.extractTextValue(value);
    if (!this.hasText(text)) return [];

    return [
      {
        title: 'Selected Project',
        dates: '',
        bullets: [{ text: text.trim() }]
      }
    ];
  }

  private extractCertifications(value: unknown): PreviewCertification[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          const item = (entry ?? {}) as Record<string, unknown>;
          return {
            name: this.firstText(item['name'], item['title']),
            date: this.firstText(item['date'], item['year'], item['issuedAt'])
          };
        })
        .filter((item) => this.hasText(item.name));
    }

    const lines = this.extractLineItems(value);
    return lines.map((line) => ({ name: line, date: '' }));
  }

  private extractLineItems(value: unknown): string[] {
    const text = this.extractTextValue(value);
    if (!this.hasText(text)) return [];

    return text
      .split(/\r?\n|,/)
      .map((line) => line.replace(/^[-*#\s]+/, '').trim())
      .filter((line) => line.length > 0);
  }

  private extractBullets(value: unknown): PreviewBullet[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((bullet) => {
        if (typeof bullet === 'string') return { text: bullet.trim() };
        if (bullet && typeof bullet === 'object' && typeof (bullet as Record<string, unknown>)['text'] === 'string') {
          return { text: String((bullet as Record<string, unknown>)['text']).trim() };
        }
        return null;
      })
      .filter((bullet): bullet is PreviewBullet => !!bullet && this.hasText(bullet.text));
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private hasText(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private firstText(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  }
}

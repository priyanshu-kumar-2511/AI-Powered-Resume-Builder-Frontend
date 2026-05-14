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
  fieldOfStudy: string;
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
  issuer: string;
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
  hasSummary: boolean;
  skills: PreviewSkill[];
  hasSkills: boolean;
  technicalSkills: PreviewSkill[];
  hasTechnicalSkills: boolean;
  softSkills: PreviewSkill[];
  hasSoftSkills: boolean;
  expertise: PreviewSkill[];
  hasExpertise: boolean;
  experience: PreviewExperience[];
  hasExperience: boolean;
  education: PreviewEducation[];
  hasEducation: boolean;
  projects: PreviewProject[];
  hasProjects: boolean;
  certifications: PreviewCertification[];
  hasCertifications: boolean;
  achievements: PreviewAchievement[];
  hasAchievements: boolean;
  additionalInfo: PreviewKeyValue[];
  hasAdditionalInfo: boolean;
  references: PreviewReference[];
  hasReferences: boolean;
  awards: PreviewSkill[];
  hasAwards: boolean;
};

@Injectable({ providedIn: 'root' })
export class TemplateRenderService {
  private readonly demoData: TemplateViewData = {
    fullName: 'Lorna Alvarado', jobTitle: 'Senior Marketing Manager', email: 'hello@reallygreatsite.com',
    phone: '+1 234 567 890', location: 'London, United Kingdom', linkedin: 'linkedin.com/in/lornaalvarado',
    github: 'github.com/lornaalvarado', website: 'www.reallygreatsite.com',
    summary: 'Strategic and results-driven Marketing Professional with over 8 years of experience in digital transformation, brand positioning, and cross-functional team leadership. Proven track record of increasing brand awareness by 40% and managing multi-million dollar budgets.',
    hasSummary: true, 
    skills: [
      { name: 'Strategic Planning' }, { name: 'Digital Marketing' }, 
      { name: 'Team Leadership' }, { name: 'Market Research' },
      { name: 'Budget Management' }, { name: 'Public Relations' }
    ], 
    hasSkills: true,
    technicalSkills: [{ name: 'SEO/SEM' }, { name: 'Google Analytics' }, { name: 'HubSpot' }, { name: 'Salesforce' }], 
    hasTechnicalSkills: true, 
    softSkills: [{ name: 'Communication' }, { name: 'Adaptability' }, { name: 'Problem Solving' }], 
    hasSoftSkills: true,
    expertise: [], hasExpertise: false, 
    experience: [
      {
        role: 'Marketing Manager', company: 'CloudScale Industries', startDate: '2020', endDate: 'Present',
        description: 'Leading global marketing strategy and execution.',
        bullets: [
          { text: 'Developed and implemented a comprehensive digital marketing strategy that increased lead generation by 45%.' },
          { text: 'Managed a cross-functional team of 12 specialists across creative, social, and performance marketing.' },
          { text: 'Reduced customer acquisition cost (CAC) by 20% through optimized ad targeting and content personalization.' }
        ]
      },
      {
        role: 'Marketing Specialist', company: 'BrightPath Solutions', startDate: '2016', endDate: '2020',
        description: 'Executed multi-channel marketing campaigns.',
        bullets: [
          { text: 'Successfully launched 4 new product lines, achieving 110% of the first-year sales target.' },
          { text: 'Orchestrated social media campaigns reaching over 1 million followers.' }
        ]
      }
    ], 
    hasExperience: true,
    education: [
      {
        degree: 'Master of Business Administration', institution: 'University of Business Excellence', fieldOfStudy: 'Marketing',
        startYear: '2014', endYear: '2016', grade: '3.9/4.0', description: '', highlights: []
      },
      {
        degree: 'Bachelor of Science', institution: 'State Tech University', fieldOfStudy: 'Communications',
        startYear: '2010', endYear: '2014', grade: '3.8/4.0', description: '', highlights: []
      }
    ], 
    hasEducation: true,
    projects: [
      {
        title: 'Global Brand Refresh', dates: '2021 - 2022',
        bullets: [{ text: 'Led a complete visual and messaging overhaul for a Fortune 500 tech client.' }]
      }
    ], 
    hasProjects: true,
    certifications: [{ name: 'Google Ads Certification', issuer: 'Google', date: '2023' }], 
    hasCertifications: true, 
    achievements: [], hasAchievements: false,
    additionalInfo: [], hasAdditionalInfo: false, references: [], hasReferences: false,
    awards: [], hasAwards: false
  };

  renderDocument(template: Template | null | undefined, options?: any): string | null {
    const layout = this.getLayout(template);
    if (!layout) return null;
    const styles = this.getStyles(template);

    // Sorting for reordering support and filtering for visibility
    const sortedSections = [...(options?.sections ?? [])]
      .filter(s => s.isVisible !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const viewData = this.buildViewData(
      sortedSections, options?.profile, options?.resume, 
      options?.useDemoData ?? (!(options?.sections?.length) && !options?.profile)
    );

    try {
      const renderedBody = Mustache.render(layout, viewData);
      const fontCss = options?.font ? `
        body { 
          font-family: '${options.font.fontFamily}' !important; 
          font-size: ${options.font.fontSize}px !important;
        }
      ` : '';
      
      const headerFontSize = options?.font?.contactFontSize || options?.contactFontSize || 24;
      const subHeaderFontSize = Math.max(10, Math.floor(headerFontSize * 0.5));
      const contactCss = `
        .header .name, 
        .navy-header .navy-name, 
        .teal-header .teal-name, 
        .timeline-header .timeline-name, 
        .mono-header h1,
        .ankesh-header h1,
        .profile-section .name,
        .ivory-header h1,
        .profile-meta .name { 
          font-size: ${headerFontSize}px !important; 
        }
        .header .job-title,
        .header .contact-bar,
        .contact-line,
        .navy-contact,
        .timeline-contact,
        .teal-contact,
        .teal-role,
        .mono-contact,
        .ankesh-sub,
        .ankesh-contact,
        .profile-section .title,
        .side-section p,
        .ivory-contact {
          font-size: ${subHeaderFontSize}px !important;
        }
      `;

      const bodyAttrs = options?.primaryColor ? ` style="--primary: ${options.primaryColor}; --accent: ${options.primaryColor};"` : '';
      return `<!DOCTYPE html><html><head><style>${styles}${fontCss}${contactCss}</style></head><body${bodyAttrs}>${renderedBody}</body></html>`;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private readonly demoSections: any[] = [
    { title: 'Professional Summary', sectionType: 'SUMMARY', content: JSON.stringify({ text: 'Strategic and results-driven Marketing Professional with over 8 years of experience in digital transformation, brand positioning, and cross-functional team leadership. Proven track record of increasing brand awareness by 40% and managing multi-million dollar budgets. Expert in leveraging data analytics to drive customer acquisition and retention strategies.', fontSize: 12 }), isVisible: true, displayOrder: 1 },
    { title: 'Work Experience', sectionType: 'EXPERIENCE', content: JSON.stringify({ items: [
      { role: 'Senior Marketing Manager', company: 'CloudScale Industries', startDate: 'Jan 2020', isCurrent: true, bullets: [
        'Developed and implemented a comprehensive digital marketing strategy that increased lead generation by 45% within the first year.',
        'Managed a cross-functional team of 15 specialists across creative, social, and performance marketing channels.',
        'Reduced customer acquisition cost (CAC) by 20% through optimized ad targeting and sophisticated content personalization.',
        'Oversaw a $2.5M annual marketing budget, consistently delivering high ROI across all campaigns.',
        'Collaborated with product teams to align marketing messaging with new feature releases.'
      ] },
      { role: 'Digital Marketing Specialist', company: 'BrightPath Solutions', startDate: 'June 2016', endDate: 'Dec 2019', bullets: [
        'Successfully launched 4 new product lines, achieving 110% of the first-year sales target and expanding market share.',
        'Orchestrated social media campaigns reaching over 1.2 million unique followers and increasing engagement by 60%.',
        'Implemented SEO best practices that moved 15 high-value keywords to the first page of Google results.',
        'Designed and executed A/B tests for email marketing, resulting in a 25% increase in open rates.'
      ] }
    ], fontSize: 12 }), isVisible: true, displayOrder: 2 },
    { title: 'Education', sectionType: 'EDUCATION', content: JSON.stringify({ items: [
      { degree: 'Master of Business Administration', institution: 'University of Business Excellence', fieldOfStudy: 'Marketing Management', startYear: '2014', endYear: '2016' },
      { degree: 'Bachelor of Science in Communications', institution: 'State Tech University', fieldOfStudy: 'Digital Media', startYear: '2010', endYear: '2014' }
    ], fontSize: 12 }), isVisible: true, displayOrder: 3 },
    { title: 'Projects', sectionType: 'PROJECTS', content: JSON.stringify({ items: [
      { title: 'Global Brand Refresh 2022', dates: '2021 - 2022', bullets: [
        'Led a complete visual and messaging overhaul for a global SaaS platform, resulting in a 30% increase in brand sentiment scores.',
        'Coordinated with external agencies and internal stakeholders to ensure brand consistency across 10+ international markets.'
      ] },
      { title: 'E-commerce Optimization Project', dates: '2019', bullets: [
        'Redesigned the checkout flow of a major retail site, reducing cart abandonment by 15%.'
      ] }
    ], fontSize: 12 }), isVisible: true, displayOrder: 4 },
    { title: 'Technical Skills', sectionType: 'SKILLS', content: JSON.stringify({ technical: ['SEO/SEM Expert', 'Google Analytics 4', 'HubSpot / Salesforce CRM', 'Adobe Creative Suite', 'Python for Data Analysis', 'SQL Queries', 'A/B Testing Tools'], soft: ['Strategic Leadership', 'Public Speaking', 'Conflict Resolution', 'Agile Project Management'], fontSize: 12 }), isVisible: true, displayOrder: 5 }
  ];

  buildViewData(sections: ResumeSection[] = [], profile: any, resume: any, useDemoData = true): TemplateViewData {
    const finalSections = (useDemoData && (!sections || sections.length === 0)) ? this.demoSections : sections;
    const viewData = useDemoData ? this.cloneDemoData() : this.createEmptyViewData();
    if (profile) {
      viewData.fullName = (profile.fullName || '').trim();
      viewData.email = (profile.email || '').trim();
      viewData.phone = (profile.mobileNumber || '').trim();
      viewData.location = (profile.location || '').trim();
      viewData.linkedin = (profile.linkedin || '').trim();
      viewData.github = (profile.github || '').trim();
      viewData.website = (profile.website || '').trim();
    }
    if (resume?.targetJobTitle) viewData.jobTitle = resume.targetJobTitle.trim();

    const dynamicSections: any[] = [];
    const additionalInfoMap = new Map<string, string>();

    finalSections.forEach(s => {
      if (!s.isVisible) return;
      let parsed = this.parseContent(s.content);
      
      let sectionFontSize = 12;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (parsed.fontSize) sectionFontSize = parsed.fontSize;
      }

      let sectionData: any = { 
        title: s.title, 
        fontSize: sectionFontSize,
        computedStyle: `font-size: ${sectionFontSize}px !important;`,
        isExperience: s.sectionType === 'EXPERIENCE',
        isEducation: s.sectionType === 'EDUCATION',
        isProjects: s.sectionType === 'PROJECTS',
        isCertifications: s.sectionType === 'CERTIFICATIONS',
        isSkills: s.sectionType === 'SKILLS',
        isSummary: s.sectionType === 'SUMMARY',
        isCustom: s.sectionType === 'CUSTOM' || s.sectionType === 'VOLUNTEER' || s.sectionType === 'LANGUAGES'
      };

      const dataToExtract = (parsed && parsed.items) ? parsed.items : parsed;

      switch (s.sectionType) {
        case 'SUMMARY':
          viewData.summary = this.renderRichText(this.extractTextValue(parsed));
          viewData.hasSummary = !!viewData.summary;
          sectionData.summary = viewData.summary;
          break;
        case 'EXPERIENCE':
          const exp = this.extractExperience(dataToExtract);
          viewData.experience.push(...exp);
          viewData.hasExperience = viewData.experience.length > 0;
          sectionData.items = exp;
          // Fallback achievements for older templates
          const achievements = exp.map(e => ({ title: e.role, description: e.bullets.map(b => b.text).join(' ') }));
          viewData.achievements.push(...achievements);
          viewData.hasAchievements = viewData.achievements.length > 0;
          break;
        case 'EDUCATION':
          const edu = this.extractEducation(dataToExtract);
          viewData.education.push(...edu);
          viewData.hasEducation = viewData.education.length > 0;
          sectionData.items = edu;
          break;
        case 'PROJECTS':
          const proj = this.extractProjects(dataToExtract);
          viewData.projects.push(...proj);
          viewData.hasProjects = viewData.projects.length > 0;
          sectionData.items = proj;
          break;
        case 'CERTIFICATIONS':
          const cert = this.extractCertifications(dataToExtract);
          viewData.certifications.push(...cert);
          viewData.hasCertifications = viewData.certifications.length > 0;
          sectionData.items = cert;
          // Map to awards for backward compatibility
          const awards = cert.map(c => ({ name: c.name }));
          viewData.awards.push(...awards);
          viewData.hasAwards = viewData.awards.length > 0;
          break;
        case 'SKILLS':
          const sk = this.extractSkills(dataToExtract);
          const combined = [...sk.technical, ...sk.soft].map(n => ({ name: n }));
          viewData.skills.push(...combined);
          viewData.hasSkills = viewData.skills.length > 0;
          viewData.technicalSkills.push(...sk.technical.map(n => ({ name: n })));
          viewData.hasTechnicalSkills = viewData.technicalSkills.length > 0;
          viewData.softSkills.push(...sk.soft.map(n => ({ name: n })));
          viewData.hasSoftSkills = viewData.softSkills.length > 0;
          viewData.expertise.push(...combined);
          viewData.hasExpertise = viewData.expertise.length > 0;
          sectionData.items = combined;
          break;
        case 'LANGUAGES':
        case 'VOLUNTEER':
        case 'CUSTOM':
          const label = s.title || (s.sectionType === 'LANGUAGES' ? 'Languages' : 'Additional Info');
          const val = this.extractTextValue(parsed);
          additionalInfoMap.set(label.toLowerCase(), val);
          sectionData.value = this.renderRichText(val);
          sectionData.isStructured = Array.isArray(dataToExtract) && dataToExtract.length > 0;
          if (sectionData.isStructured) {
            sectionData.items = this.extractExperience(dataToExtract);
          }
          break;
      }
      dynamicSections.push(sectionData);
    });

    viewData.additionalInfo = Array.from(additionalInfoMap.entries()).map(([k, v]) => ({ 
      label: k.charAt(0).toUpperCase() + k.slice(1), 
      value: v 
    }));
    viewData.hasAdditionalInfo = viewData.additionalInfo.length > 0;

    (viewData as any).sections = dynamicSections;
    return viewData;
  }

  private getLayout(t: any) {
    const fallback = resolveTemplateFallback(t);
    if (fallback) return fallback.htmlLayout;
    return t?.html_layout || t?.htmlLayout;
  }

  private getStyles(t: any) {
    const fallback = resolveTemplateFallback(t);
    if (fallback) return fallback.cssStyles;
    return t?.css_styles || t?.cssStyles;
  }
  private cloneDemoData(): TemplateViewData { return JSON.parse(JSON.stringify(this.demoData)); }
  private createEmptyViewData(): TemplateViewData {
    return {
      fullName: '', jobTitle: '', email: '', phone: '', location: '',
      linkedin: '', github: '', website: '', summary: '', hasSummary: false,
      skills: [], hasSkills: false, technicalSkills: [], hasTechnicalSkills: false,
      softSkills: [], hasSoftSkills: false, expertise: [], hasExpertise: false,
      experience: [], hasExperience: false, education: [], hasEducation: false,
      projects: [], hasProjects: false, certifications: [], hasCertifications: false,
      achievements: [], hasAchievements: false, additionalInfo: [], hasAdditionalInfo: false,
      references: [], hasReferences: false, awards: [], hasAwards: false
    };
  }
  private parseContent(c: any) { try { return typeof c === 'string' ? JSON.parse(c) : c; } catch { return c; } }
  private extractTextValue(v: any) { return v?.text || v?.html || (typeof v === 'string' ? v : ''); }
  
  private renderRichText(v: string) { 
    if (!v) return '';
    // 1. Escape HTML for XSS protection
    let escaped = v.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#039;');
    
    // 2. Simple Markdown parsing
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\+\+(.*?)\+\+/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/\n/g, '<br/>');
  }

  private extractExperience(v: any): PreviewExperience[] {
    if (!v) return [];
    const items = Array.isArray(v) ? v : [v];
    return items.map(e => {
      if (typeof e === 'string') return { role: 'Selected Experience', company: '', startDate: '', endDate: '', description: e, bullets: [{ text: e }] };
      return {
        role: e.role || e.title || '',
        company: e.company || e.subtitle || e.organization || '',
        startDate: e.startDate || '',
        endDate: e.isCurrent ? 'Present' : (e.endDate || ''),
        description: e.description || (e.bullets || []).map((b: any) => typeof b === 'string' ? b : (b.text || '')).join(' '),
        bullets: (e.bullets || []).map((b: any) => ({ text: typeof b === 'string' ? b : (b.text || '') }))
      };
    });
  }

  private extractEducation(v: any): PreviewEducation[] {
    if (!v) return [];
    const items = Array.isArray(v) ? v : [v];
    return items.map((e: any) => {
      const description = e.description || e.fieldOfStudy || e.grade || '';
      return {
        degree: e.degree || e.title || '',
        institution: e.institution || e.subtitle || '',
        fieldOfStudy: e.fieldOfStudy || '',
        startYear: e.startYear || e.startDate || '',
        endYear: e.isCurrent ? 'Present' : (e.endYear || e.endDate || ''),
        grade: e.grade || '',
        description: description,
        highlights: (e.bullets || []).length > 0 ? 
           (e.bullets || []).map((b: any) => ({ text: typeof b === 'string' ? b : (b.text || '') })) :
           (description ? [{ text: description }] : [])
      };
    });
  }

  private extractProjects(v: any): PreviewProject[] {
    if (!v) return [];
    const items = Array.isArray(v) ? v : [v];
    return items.map(e => {
      if (typeof e === 'string') return { title: 'Selected Project', dates: '', bullets: [{ text: e }] };
      return {
        title: e.name || e.title || '',
        dates: `${e.startDate || ''}${e.startDate && e.endDate ? ' - ' : ''}${e.isCurrent ? 'Present' : (e.endDate || '')}`,
        bullets: (e.bullets || []).map((b: any) => ({ text: typeof b === 'string' ? b : (b.text || '') }))
      };
    });
  }

  private extractCertifications(v: any): PreviewCertification[] {
    if (!v) return [];
    if (typeof v === 'string') return v.split(',').map(s => ({ name: s.trim(), issuer: '', date: '' }));
    const items = Array.isArray(v) ? v : [v];
    return items.map(e => ({
      name: e.title || e.name || '',
      issuer: e.subtitle || e.issuer || e.organization || '',
      date: e.date || e.year || e.issuedAt || e.startDate || ''
    }));
  }

  private extractSkills(v: any) {
    if (!v) return { technical: [], soft: [] };
    if (typeof v === 'string') return { technical: v.split(',').map(s => s.trim()), soft: [] };
    if (Array.isArray(v)) {
       const technical = v.map(i => typeof i === 'object' ? (i.name || i.title || '') : String(i)).filter(Boolean);
       return { technical, soft: [] };
    }
    const technical: string[] = [];
    const soft: string[] = [];
    if (v.technical && Array.isArray(v.technical)) technical.push(...v.technical.map(String));
    if (v.soft && Array.isArray(v.soft)) soft.push(...v.soft.map(String));
    
    // Handle arbitrary keys (categories)
    Object.keys(v).forEach(key => {
      if (key !== 'technical' && key !== 'soft' && key !== 'fontSize' && Array.isArray(v[key])) {
        technical.push(...v[key].map(String));
      }
    });

    return { technical, soft };
  }
}

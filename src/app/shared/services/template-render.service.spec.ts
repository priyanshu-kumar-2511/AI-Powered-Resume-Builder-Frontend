import { TestBed } from '@angular/core/testing';
import { TemplateRenderService } from './template-render.service';
import { ResumeSection } from '../models/models';
import Mustache from 'mustache';

describe('TemplateRenderService', () => {
  let service: TemplateRenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TemplateRenderService]
    });
    service = TestBed.inject(TemplateRenderService);
  });

  it('should render document with demo data', () => {
    const template = { templateId: 1, name: 'Classic ATS', htmlLayout: '<div>{{fullName}}</div>', cssStyles: 'body { color: red; }' } as any;
    const html = service.renderDocument(template, { useDemoData: true });
    expect(html).toContain('Lorna Alvarado');
    expect(html).toContain('red');
  });

  it('should render document with explicit layout and styles', () => {
    const template = { htmlLayout: '<span>Layout</span>', cssStyles: '.s { color: blue; }' } as any;
    const html = service.renderDocument(template, { useDemoData: false });
    expect(html).toContain('Layout');
    expect(html).toContain('.s { color: blue; }');
  });

  it('should handle layout/styles fallback branches', () => {
    // Branch: t?.html_layout || t?.htmlLayout
    const t1 = { html_layout: 'L1' } as any;
    expect((service as any).getLayout(t1)).toBe('L1');
    const t2 = { htmlLayout: 'L2' } as any;
    expect((service as any).getLayout(t2)).toBe('L2');

    // Branch: t?.css_styles || t?.cssStyles
    const s1 = { css_styles: 'S1' } as any;
    expect((service as any).getStyles(s1)).toBe('S1');
    const s2 = { cssStyles: 'S2' } as any;
    expect((service as any).getStyles(s2)).toBe('S2');
  });


  it('should handle font CSS branch', () => {
    const template = { htmlLayout: '<div></div>' } as any;
    const html = service.renderDocument(template, {
      font: { fontFamily: 'Roboto', fontSize: 14 }
    });
    expect(html).toContain("font-family: 'Roboto' !important;");
  });

  it('should handle render failure catch block', () => {
    spyOn(console, 'error');
    const template = { htmlLayout: '<div></div>' } as any;
    spyOn(Mustache, 'render').and.throwError('Mock Error');
    const result = service.renderDocument(template);
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });




  it('should handle all profile social fields', () => {
    const profile = {
      fullName: ' John ',
      email: ' j@d.com ',
      mobileNumber: ' 123 ',
      location: ' NY ',
      linkedin: ' ln ',
      github: ' gh ',
      website: ' web '
    } as any;
    const data = service.buildViewData([], profile, null, false);
    expect(data.fullName).toBe('John');
    expect(data.email).toBe('j@d.com');
    expect(data.phone).toBe('123');
    expect(data.location).toBe('NY');
    expect(data.linkedin).toBe('ln');
    expect(data.github).toBe('gh');
    expect(data.website).toBe('web');
  });

  it('should handle resume targetJobTitle', () => {
    const resume = { targetJobTitle: ' Architect ' } as any;
    const data = service.buildViewData([], null, resume, false);
    expect(data.jobTitle).toBe('Architect');
  });

  it('should determine useDemoData automatically if no data provided', () => {
    const data = service.buildViewData([], null, null);
    expect(data.fullName).toBe('Lorna Alvarado'); // Demo data
  });

  describe('Section Data Extraction', () => {
    it('should parse rich text in summary (bold, italic, etc)', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SUMMARY',
        content: JSON.stringify({ text: 'This is **bold**, *italic*, ++under++, and ~~strike~~.' }),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.summary).toContain('<strong>bold</strong>');
      expect(data.summary).toContain('<em>italic</em>');
      expect(data.summary).toContain('<u>under</u>');
      expect(data.summary).toContain('<s>strike</s>');
    });

    it('should escape HTML in summary to prevent XSS', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SUMMARY',
        content: JSON.stringify({ text: '<script>alert(1)</script>' }),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.summary).toContain('&lt;script&gt;');
    });

    it('should extract technical and soft skills from object', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SKILLS',
        content: JSON.stringify({ technical: ['Angular', 'TS'], soft: ['Leadership'] }),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.technicalSkills.length).toBe(2);
      expect(data.softSkills.length).toBe(1);
      expect(data.expertise.length).toBe(3);
    });

    it('should extract skills from array of strings', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SKILLS',
        content: JSON.stringify(['Skill A', 'Skill B']),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.skills.length).toBe(2);
    });

    it('should extract skills from array of objects', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SKILLS',
        content: JSON.stringify([{ name: 'Skill 1' }, { name: 'Skill 2' }]),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.technicalSkills.map(s => s.name)).toEqual(['Skill 1', 'Skill 2']);
    });

    it('should extract skills from object with arbitrary keys', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SKILLS',
        content: JSON.stringify({ categoryA: ['S1'], categoryB: ['S2'] }),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.skills.map(s => s.name)).toEqual(['S1', 'S2']);
    });

    it('should extract EXPERIENCE with bullets and fallback to achievements', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'EXPERIENCE',
        content: JSON.stringify([
          { role: 'Dev', company: 'X', startDate: '2020', isCurrent: true, bullets: ['Task 1', { text: 'Task 2' }] }
        ]),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.experience.length).toBe(1);
      expect(data.experience[0].role).toBe('Dev');
      expect(data.experience[0].bullets.length).toBe(2);
      expect(data.experience[0].endDate).toBe('Present');
      expect(data.achievements.length).toBe(1);
      expect(data.achievements[0].title).toBe('Dev');
    });

    it('should handle EXPERIENCE description fallback to bullets text', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'EXPERIENCE',
        content: JSON.stringify([{ company: 'Co', bullets: ['B1', 'B2'] }]),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.experience[0].description).toBe('B1 B2');
    });

    it('should handle experience string branch', () => {
      const sections = [{ sectionType: 'EXPERIENCE', content: JSON.stringify(['Worked at X']), isVisible: true }] as any;
      const data = service.buildViewData(sections, null, null, false);
      expect(data.experience[0].role).toBe('Selected Experience');
      expect(data.experience[0].description).toBe('Worked at X');
    });

    it('should handle experience field fallbacks', () => {
      const sections = [{ sectionType: 'EXPERIENCE', content: JSON.stringify([{ title: 'CEO', subtitle: 'Global Corp' }]), isVisible: true }] as any;
      const data = service.buildViewData(sections, null, null, false);
      expect(data.experience[0].role).toBe('CEO');
      expect(data.experience[0].company).toBe('Global Corp');
    });

    it('should fallback to fieldOfStudy/grade in EDUCATION highlights', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'EDUCATION',
        content: JSON.stringify([{ institution: 'Ins', fieldOfStudy: 'CS', grade: 'A' }]),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.education[0].description).toBe('CS');
      expect(data.education[0].highlights[0].text).toBe('CS');
    });
    it('should handle education isCurrent and alternate fields', () => {
      const sections = [{ sectionType: 'EDUCATION', content: JSON.stringify([{ title: 'MS', subtitle: 'MIT', startDate: '2020', isCurrent: true }]), isVisible: true }] as any;
      const data = service.buildViewData(sections, null, null, false);
      expect(data.education[0].degree).toBe('MS');
      expect(data.education[0].institution).toBe('MIT');
      expect(data.education[0].endYear).toBe('Present');
    });

    it('should handle education bullets vs description highlights', () => {
      // Case: no bullets, but has description
      const s1 = [{ sectionType: 'EDUCATION', content: JSON.stringify({ institution: 'X', grade: 'A' }), isVisible: true }] as any;
      const d1 = service.buildViewData(s1, null, null, false);
      expect(d1.education[0].highlights[0].text).toBe('A');

      // Case: neither bullets nor description
      const s2 = [{ sectionType: 'EDUCATION', content: JSON.stringify({ institution: 'X' }), isVisible: true }] as any;
      const d2 = service.buildViewData(s2, null, null, false);
      expect(d2.education[0].highlights).toEqual([]);
    });

    it('should handle PROJECTS name/role and date concatenation', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'PROJECTS',
        content: JSON.stringify([{ name: 'ProjName', role: 'Lead', startDate: '2021', endDate: '2022' }]),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.projects[0].title).toBe('ProjName');
      expect(data.projects[0].dates).toBe('2021 - 2022');
    });

    it('should handle single string PROJECT content', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'PROJECTS',
        content: JSON.stringify('Single project text'),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.projects[0].title).toBe('Selected Project');
      expect(data.projects[0].bullets[0].text).toBe('Single project text');
    });
    it('should handle projects isCurrent and string branch', () => {
      const s1 = [{ sectionType: 'PROJECTS', content: JSON.stringify({ name: 'P', startDate: '2020', isCurrent: true }), isVisible: true }] as any;
      const d1 = service.buildViewData(s1, null, null, false);
      expect(d1.projects[0].dates).toContain('Present');

      const s2 = [{ sectionType: 'PROJECTS', content: JSON.stringify(['Proj A']), isVisible: true }] as any;
      const d2 = service.buildViewData(s2, null, null, false);
      expect(d2.projects[0].title).toBe('Selected Project');
    });

    it('should handle CERTIFICATIONS title/year/issuedAt', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'CERTIFICATIONS',
        content: JSON.stringify([{ title: 'Cert', year: '2021' }, { name: 'Cert2', issuedAt: '2022' }]),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.certifications[0].name).toBe('Cert');
      expect(data.certifications[0].date).toBe('2021');
      expect(data.certifications[1].date).toBe('2022');
      expect(data.awards.length).toBe(2);
    });

    it('should handle single string CERTIFICATION content', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'CERTIFICATIONS',
        content: JSON.stringify('AWS, Azure'),
        isVisible: true
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.certifications.length).toBe(2);
      expect(data.certifications[0].name).toBe('AWS');
    });
    it('should handle certifications issuer fallbacks and string branch', () => {
      const s1 = [{ sectionType: 'CERTIFICATIONS', content: JSON.stringify({ name: 'C', organization: 'Org' }), isVisible: true }] as any;
      const d1 = service.buildViewData(s1, null, null, false);
      expect(d1.certifications[0].issuer).toBe('Org');

      const s2 = [{ sectionType: 'CERTIFICATIONS', content: JSON.stringify({ name: 'C', issuedAt: '2020' }), isVisible: true }] as any;
      const d2 = service.buildViewData(s2, null, null, false);
      expect(d2.certifications[0].date).toBe('2020');

      const s3 = [{ sectionType: 'CERTIFICATIONS', content: JSON.stringify('Cert 1, Cert 2'), isVisible: true }] as any;
      const d3 = service.buildViewData(s3, null, null, false);
      expect(d3.certifications.length).toBe(2);
    });

    it('should handle LANGUAGES section', () => {
      const sections: ResumeSection[] = [
        { sectionType: 'LANGUAGES', content: JSON.stringify({ text: 'English, Spanish' }), isVisible: true } as any
      ];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.additionalInfo[0].label).toBe('Languages');
      expect(data.additionalInfo[0].value).toBe('English, Spanish');
    });

    it('should handle additionalInfo merging and CUSTOM sections', () => {
      const sections: ResumeSection[] = [
        { sectionType: 'LANGUAGES', content: JSON.stringify('English'), isVisible: true } as any,
        { sectionType: 'CUSTOM', title: 'languages', content: JSON.stringify('Spanish'), isVisible: true } as any,
        { sectionType: 'VOLUNTEER', title: 'Charity', content: JSON.stringify('Helping out'), isVisible: true } as any
      ];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.additionalInfo.length).toBe(2);
      expect(data.additionalInfo[0].label.toLowerCase()).toBe('languages');
      expect(data.additionalInfo[0].value).toBe('Spanish'); // Merged/overwritten
      expect(data.additionalInfo[1].label).toBe('Charity');
    });

    it('should skip hidden sections', () => {
      const sections: ResumeSection[] = [{
        sectionType: 'SUMMARY', content: JSON.stringify('Bio'), isVisible: false
      } as any];
      const data = service.buildViewData(sections, null, null, false);
      expect(data.summary).toBe('');
    });
  });

  it('should fallback to default template if input is null', () => {
    const html = service.renderDocument(null, { useDemoData: true });
    expect(html).toContain('Lorna Alvarado');
    expect(html).toContain('Professional Summary');
  });

  it('should support snake_case template properties', () => {
    const template = { html_layout: '<div>Snake</div>', css_styles: '.snake {}' } as any;
    const html = service.renderDocument(template, { useDemoData: false });
    expect(html).toContain('Snake');
    expect(html).toContain('.snake {}');
  });

  it('should handle parseContent failure by returning original string', () => {
    const sections: ResumeSection[] = [{
      sectionType: 'SUMMARY',
      content: '{invalid-json}',
      isVisible: true
    } as any];
    const data = service.buildViewData(sections, null, null, false);
    expect(data.summary).toBe('{invalid-json}');
  });

  it('should convert newlines to <br/> in rich text', () => {
    const sections: ResumeSection[] = [{
      sectionType: 'SUMMARY',
      content: JSON.stringify({ text: "Line 1\nLine 2" }),
      isVisible: true
    } as any];
    const data = service.buildViewData(sections, null, null, false);
    expect(data.summary).toBe('Line 1<br/>Line 2');
  });
});

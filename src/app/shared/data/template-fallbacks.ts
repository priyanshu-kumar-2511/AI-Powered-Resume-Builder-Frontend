/**
 * @file template-fallbacks.ts
 * @description This file contains hardcoded fallback templates for the ResumeAI platform.
 * These fallbacks are used as a safety net if the backend template-service is unavailable 
 * or if a specific template's HTML/CSS data fails to load.
 */

import { Template } from '../models/models';

/**
 * Interface representing a template's visual and structural data.
 */
type TemplateFallback = {
  templateId?: number; // Optional unique identifier matching the database ID
  name: string;        // Human-readable template name
  htmlLayout: string;  // Mustache-compatible HTML structure
  cssStyles: string;   // Minified or raw CSS for the template
};

/**
 * Array of predefined resume templates.
 * Each template uses Mustache syntax (e.g., {{fullName}}) for data binding.
 */
const TEMPLATE_FALLBACKS: TemplateFallback[] = [
  {
    templateId: 1,
    name: 'Classic ATS',
    htmlLayout: `<div class="resume">
  <header class="header">
    <h1 class="name">{{fullName}}</h1>
    <div class="contact-bar">
      <span>{{phone}}</span>
      <span>{{email}}</span>
      <span>{{linkedin}}</span>
      <span>{{github}}</span>
    </div>
  </header>

  <section class="section">
    <h2 class="section-title">Career Objective</h2>
    <p class="summary-text">{{{summary}}}</p>
  </section>

  <section class="section">
    <h2 class="section-title">Education</h2>
    {{#education}}
    <div class="edu-item">
      <div class="edu-row">
        <strong class="edu-degree">{{degree}}</strong>
        <span class="edu-dates">{{startYear}} - {{endYear}}</span>
      </div>
      <div class="edu-row">
        <span class="edu-institution">{{institution}}</span>
        <span class="edu-grade">{{grade}}</span>
      </div>
    </div>
    {{/education}}
  </section>

  <section class="section two-col-section">
    <div class="col">
      <h2 class="section-title">Technical Skills</h2>
      <ul class="bullet-list">
        {{#technicalSkills}}<li>{{name}}</li>{{/technicalSkills}}
      </ul>
    </div>
    <div class="col">
      <h2 class="section-title">Soft Skills</h2>
      <ul class="bullet-list">
        {{#softSkills}}<li>{{name}}</li>{{/softSkills}}
      </ul>
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">Experience</h2>
    {{#experience}}
    <div class="exp-item">
      <div class="exp-header">
        <strong class="exp-company">{{company}}</strong>
        <span class="exp-dates">{{startDate}} - {{endDate}}</span>
      </div>
      <div class="exp-role">{{role}}</div>
      <ul class="bullet-list">
        {{#bullets}}<li>{{text}}</li>{{/bullets}}
      </ul>
    </div>
    {{/experience}}
  </section>

  <section class="section">
    <h2 class="section-title">Projects</h2>
    {{#projects}}
    <div class="project-item">
      <div class="project-header">
        <strong>{{title}}</strong>
        <span class="exp-dates">{{dates}}</span>
      </div>
      <ul class="bullet-list">
        {{#bullets}}<li>{{text}}</li>{{/bullets}}
      </ul>
    </div>
    {{/projects}}
  </section>

  <section class="section">
    <h2 class="section-title">Certifications</h2>
    {{#certifications}}
    <div class="cert-row">
      <span>- {{name}}</span>
      <span class="exp-dates">{{date}}</span>
    </div>
    {{/certifications}}
  </section>
</div>`,
    cssStyles: `*{box-sizing:border-box;margin:0;padding:0}body{background:#fff}.resume{font-family:"Times New Roman",Times,serif;max-width:780px;margin:0 auto;padding:36px 40px;color:#111;font-size:13px;line-height:1.55;background:#fff}.header{text-align:center;margin-bottom:14px}.name{font-size:26px;font-weight:700;letter-spacing:.02em;margin-bottom:8px}.contact-bar{display:flex;justify-content:center;flex-wrap:wrap;gap:16px;font-size:12px;color:#333;border-top:1.5px solid #111;border-bottom:1.5px solid #111;padding:6px 0}.section{margin-bottom:16px}.section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5px solid #111;padding-bottom:3px;margin-bottom:10px}.summary-text{font-size:12.5px}.two-col-section{display:grid;grid-template-columns:1fr 1fr;gap:24px}.col .section-title{margin-top:0}.edu-item{margin-bottom:8px}.edu-row{display:flex;justify-content:space-between}.edu-degree{font-weight:600}.edu-institution{color:#333}.edu-dates,.edu-grade{font-size:12px;color:#444}.exp-item,.project-item{margin-bottom:12px}.exp-header,.project-header{display:flex;justify-content:space-between;align-items:baseline}.exp-company{font-weight:700}.exp-role{font-style:italic;font-size:12.5px;margin:2px 0 5px}.exp-dates{font-size:12px;color:#444}.bullet-list{padding-left:18px;margin-top:4px}.bullet-list li{margin-bottom:3px;font-size:12.5px}.cert-row{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px}`
  },
  {
    templateId: 2,
    name: 'Corporate Clean',
    htmlLayout: `<div class="resume">
  <header class="header">
    <h1 class="name">{{fullName}}</h1>
    <p class="job-title">{{jobTitle}}</p>
    <div class="contact-line">{{email}} | {{phone}} | {{location}}</div>
  </header>

  <section class="section">
    <div class="section-title-bar"><h2>SUMMARY</h2></div>
    <p class="summary-text">{{{summary}}}</p>
  </section>

  <section class="section">
    <div class="section-title-bar"><h2>WORK EXPERIENCE</h2></div>
    {{#experience}}
    <div class="exp-item">
      <div class="exp-header">
        <strong class="exp-role">{{role}}, {{company}}</strong>
        <span class="exp-dates">{{startDate}} - {{endDate}}</span>
      </div>
      <ul class="bullet-list">
        {{#bullets}}<li>{{text}}</li>{{/bullets}}
      </ul>
    </div>
    {{/experience}}
  </section>

  <section class="section">
    <div class="section-title-bar"><h2>PROJECTS</h2></div>
    {{#projects}}
    <div class="exp-item">
      <div class="exp-header">
        <strong class="exp-role">{{title}}</strong>
        <span class="exp-dates">{{dates}}</span>
      </div>
      <ul class="bullet-list">
        {{#bullets}}<li>{{text}}</li>{{/bullets}}
      </ul>
    </div>
    {{/projects}}
  </section>

  <section class="section">
    <div class="section-title-bar"><h2>CERTIFICATIONS</h2></div>
    {{#certifications}}
    <div class="exp-item" style="margin-bottom: 8px;">
      <div class="exp-header">
        <strong class="exp-role">{{name}}</strong>
        <span class="exp-dates">{{date}}</span>
      </div>
    </div>
    {{/certifications}}
  </section>

  <section class="section">
    <div class="section-title-bar"><h2>EDUCATION</h2></div>
    {{#education}}
    <div class="edu-item">
      <div class="edu-header">
        <strong>{{degree}}</strong>
        <span class="exp-dates">{{startYear}} - {{endYear}}</span>
      </div>
      <div class="edu-institution">{{institution}}</div>
      <ul class="bullet-list">
        {{#highlights}}<li>{{text}}</li>{{/highlights}}
      </ul>
    </div>
    {{/education}}
  </section>

  <section class="section">
    <div class="section-title-bar"><h2>KEY SKILLS</h2></div>
    <div class="skills-grid">
      {{#skills}}<span class="skill-item">- {{name}}</span>{{/skills}}
    </div>
  </section>
</div>`,
    cssStyles: `*{box-sizing:border-box;margin:0;padding:0}body{background:#fff}.resume{font-family:"Open Sans",Arial,sans-serif;max-width:780px;margin:0 auto;padding:40px;color:#111;font-size:13px;line-height:1.6;background:#fff}.header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #111}.name{font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}.job-title{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#444;margin-bottom:8px}.contact-line{font-size:12.5px;color:#555}.section{margin-bottom:20px}.section-title-bar{background:#f0f0f0;padding:5px 10px;margin-bottom:12px}.section-title-bar h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#111}.exp-item,.edu-item{margin-bottom:14px}.exp-header,.edu-header{display:flex;justify-content:space-between;align-items:baseline}.exp-role{font-weight:700;font-size:13px}.exp-dates{font-size:12px;color:#555}.edu-institution{font-size:12.5px;color:#333;margin:3px 0}.bullet-list{padding-left:18px;margin-top:6px}.bullet-list li{margin-bottom:4px;font-size:12.5px;text-align:justify}.skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px}.skill-item{font-size:12.5px}`
  },
  {
    templateId: 3,
    name: 'Modern Sidebar',
    htmlLayout: `<div class="creative-resume">
  <div class="sidebar">
    <div class="profile-section">
      <h1 class="name">{{fullName}}</h1>
      <p class="title">{{jobTitle}}</p>
    </div>

    <div class="side-section">
      <h3>Contact</h3>
      <p>{{email}}</p>
      <p>{{phone}}</p>
      <p>{{location}}</p>
      <p>{{linkedin}}</p>
    </div>

    <div class="side-section">
      <h3>Skills</h3>
      <ul class="skills-list">
        {{#skills}}<li>{{name}}</li>{{/skills}}
      </ul>
    </div>

    <div class="side-section">
      <h3>Education</h3>
      {{#education}}
      <div class="side-edu">
        <strong class="side-degree">{{degree}}</strong>
        <span class="side-inst">{{institution}}</span>
        <span class="side-dates">{{startYear}} - {{endYear}}</span>
      </div>
      {{/education}}
    </div>

    <div class="side-section">
      <h3>Certifications</h3>
      {{#certifications}}
      <div class="side-edu">
        <strong class="side-degree">{{name}}</strong>
        <span class="side-dates">{{date}}</span>
      </div>
      {{/certifications}}
    </div>
  </div>

  <div class="main-content">
    <section class="main-section">
      <h2>About Me</h2>
      <p>{{{summary}}}</p>
    </section>

    <section class="main-section">
      <h2>Area of Expertise</h2>
      <div class="expertise-grid">
        {{#expertise}}<span>{{name}}</span>{{/expertise}}
      </div>
    </section>

    <section class="main-section">
      <h2>Professional Experience</h2>
      {{#experience}}
      <div class="exp-block">
        <div class="exp-meta">
          <strong>{{role}}, {{company}}</strong>
          <span class="exp-dates">{{startDate}} - {{endDate}}</span>
        </div>
        <ul class="main-bullets">
          {{#bullets}}<li>{{text}}</li>{{/bullets}}
        </ul>
      </div>
      {{/experience}}
    </section>

    <section class="main-section">
      <h2>Projects</h2>
      {{#projects}}
      <div class="exp-block">
        <div class="exp-meta">
          <strong>{{title}}</strong>
          <span class="exp-dates">{{dates}}</span>
        </div>
        <ul class="main-bullets">
          {{#bullets}}<li>{{text}}</li>{{/bullets}}
        </ul>
      </div>
      {{/projects}}
    </section>

    <section class="main-section">
      <h2>Additional Information</h2>
      <ul class="main-bullets">
        {{#additionalInfo}}<li><strong>{{label}}:</strong> {{value}}</li>{{/additionalInfo}}
      </ul>
    </section>
  </div>
</div>`,
    cssStyles: `*{box-sizing:border-box;margin:0;padding:0}body{background:#fff}.creative-resume{display:grid;grid-template-columns:260px 1fr;min-height:100vh;font-family:"Outfit",sans-serif;font-size:13px;background:#fff}.sidebar{background:#111827;color:#fff;padding:36px 24px}.name{font-size:22px;font-weight:700;color:#fff;margin-bottom:5px;line-height:1.2}.title{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:28px}.side-section{margin-bottom:24px}.side-section h3{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#60a5fa;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:5px;margin-bottom:10px}.side-section p{font-size:12px;color:#d1d5db;margin-bottom:6px}.skills-list{list-style:none}.skills-list li{background:rgba(255,255,255,.06);margin-bottom:5px;padding:4px 10px;border-radius:4px;font-size:12px;color:#e5e7eb}.side-edu{margin-bottom:10px}.side-degree{display:block;font-size:12px;font-weight:600;color:#fff}.side-inst{display:block;font-size:11px;color:#9ca3af}.side-dates{font-size:11px;color:#6b7280}.main-content{padding:36px;background:#fff}.main-section{margin-bottom:22px}.main-section h2{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e5e7eb;padding-bottom:5px;margin-bottom:12px;color:#111}.expertise-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:12.5px;color:#374151}.exp-block{margin-bottom:14px}.exp-meta{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}.exp-meta strong{font-size:13px;color:#111}.exp-dates{font-size:12px;color:#6b7280}.main-bullets{padding-left:16px}.main-bullets li{margin-bottom:4px;font-size:12.5px;color:#374151}`
  },
  {
    templateId: 4,
    name: 'Executive Navy',
    htmlLayout: `<div class="navy-resume">
  <header class="navy-header">
    <h1 class="navy-name">{{fullName}}</h1>
    <div class="navy-contact">{{email}} | {{phone}} | {{location}}</div>
  </header>

  <section class="section summary">
    <h2>Summary</h2>
    <p>{{{summary}}}</p>
  </section>

  <section class="section experience">
    <h2>Work Experience</h2>
    {{#experience}}
    <article class="navy-block">
      <div class="navy-row">
        <strong>{{role}}</strong>
        <span>{{startDate}} - {{endDate}}</span>
      </div>
      <div class="navy-company">{{company}}</div>
      <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
    </article>
    {{/experience}}
  </section>

  <section class="section experience">
    <h2>Projects</h2>
    {{#projects}}
    <article class="navy-block">
      <div class="navy-row">
        <strong>{{title}}</strong>
        <span>{{dates}}</span>
      </div>
      <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
    </article>
    {{/projects}}
  </section>

  <div class="navy-grid">
    <section class="section education">
      <h2>Education</h2>
      {{#education}}
      <article class="navy-block">
        <strong>{{degree}}</strong>
        <div>{{institution}}</div>
        <div class="navy-muted">{{startYear}} - {{endYear}}</div>
      </article>
      {{/education}}
    </section>

    <section class="section skills">
      <h2>Skills</h2>
      <ul class="navy-list">{{#skills}}<li>{{name}}</li>{{/skills}}</ul>
      <h2 class="extra-title">Awards</h2>
      <ul class="navy-list">{{#awards}}<li>{{name}}</li>{{/awards}}</ul>

      <h2 class="extra-title" style="margin-top:16px">Certifications</h2>
      <ul class="navy-list">
        {{#certifications}}<li><strong>{{name}}</strong> <span class="navy-muted">{{date}}</span></li>{{/certifications}}
      </ul>
    </section>
  </div>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:Inter,Arial,sans-serif}.navy-resume{max-width:820px;margin:0 auto;padding:0 0 36px}.navy-header{background:linear-gradient(135deg,color-mix(in srgb,var(--primary,#0f172a) 26%, #0f172a),#0f172a);color:#fff;text-align:center;padding:36px 40px 28px;margin-bottom:24px}.navy-name{margin:0 0 8px;font-size:34px;letter-spacing:.08em;text-transform:uppercase}.navy-contact{font-size:11px;color:#cbd5e1}.section{padding:0 38px;margin-bottom:22px}.section h2,.extra-title{margin:0 0 12px;font-size:12px;color:var(--primary,#0891b2);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #dbe4ee;padding-bottom:5px}.navy-block{margin-bottom:14px}.navy-row{display:flex;justify-content:space-between;gap:12px}.navy-company{margin:3px 0 6px;color:var(--primary,#0891b2);font-weight:600}.navy-block ul{margin:6px 0 0;padding-left:18px}.navy-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.navy-muted{color:#64748b;font-size:11px}.navy-list{margin:0;padding-left:18px}`
  },
  {
    templateId: 5,
    name: 'Minimalist Timeline',
    htmlLayout: `<div class="timeline-resume">
  <header class="timeline-header">
    <div>
      <h1 class="timeline-name">{{fullName}}</h1>
      <p class="timeline-role">{{jobTitle}}</p>
    </div>
    <div class="timeline-contact">
      <span>{{phone}}</span>
      <span>{{location}}</span>
      <span>{{email}}</span>
    </div>
  </header>

  <section class="section summary">
    <h2>About Me</h2>
    <p>{{{summary}}}</p>
  </section>

  <section class="section education">
    <h2>Education</h2>
    {{#education}}
    <article class="timeline-item">
      <div class="timeline-left">
        <strong>{{startYear}} - {{endYear}}</strong>
        <span>{{institution}}</span>
      </div>
      <div class="timeline-right">
        <strong>{{degree}}</strong>
        <p>{{description}}</p>
      </div>
    </article>
    {{/education}}
  </section>

  <section class="section experience">
    <h2>Experience</h2>
    {{#experience}}
    <article class="timeline-item">
      <div class="timeline-left">
        <strong>{{startDate}} - {{endDate}}</strong>
        <span>{{company}}</span>
      </div>
      <div class="timeline-right">
        <strong>{{role}}</strong>
        <p>{{description}}</p>
      </div>
    </article>
    {{/experience}}
  </section>

  <section class="section experience">
    <h2>Projects</h2>
    {{#projects}}
    <article class="timeline-item">
      <div class="timeline-left">
        <strong>{{dates}}</strong>
      </div>
      <div class="timeline-right">
        <strong>{{title}}</strong>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </div>
    </article>
    {{/projects}}
  </section>

  <section class="section experience">
    <h2>Certifications</h2>
    {{#certifications}}
    <article class="timeline-item">
      <div class="timeline-left">
        <strong>{{date}}</strong>
      </div>
      <div class="timeline-right">
        <strong>{{name}}</strong>
      </div>
    </article>
    {{/certifications}}
  </section>

  <section class="section skills">
    <h2>Skills</h2>
    <div class="timeline-skills">{{#skills}}<span>{{name}}</span>{{/skills}}</div>
  </section>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#1f2937;font-family:Raleway,Arial,sans-serif}.timeline-resume{max-width:820px;margin:0 auto;padding:40px;border:1px solid #dbe4ee;background:#fff}.timeline-header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid var(--primary,#0f172a);padding-bottom:18px;margin-bottom:24px}.timeline-name{margin:0 0 4px;font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:var(--primary,#0f172a)}.timeline-role{margin:0;color:#64748b;text-transform:uppercase;letter-spacing:.16em;font-size:11px}.timeline-contact{display:flex;flex-direction:column;gap:5px;font-size:11px;color:#475569}.section{margin-bottom:22px}.section h2{margin:0 0 14px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #cbd5e1;padding-bottom:4px;color:var(--primary,#0f172a)}.timeline-item{display:grid;grid-template-columns:170px 1fr;gap:18px;margin-bottom:14px}.timeline-left{display:flex;flex-direction:column;gap:3px;font-size:11px;color:#64748b}.timeline-right strong{display:block;margin-bottom:4px}.timeline-right p{margin:0;font-size:11.5px;color:#475569}.timeline-right ul{margin:4px 0 0;padding-left:16px;font-size:11.5px;color:#475569}.timeline-skills{display:flex;flex-wrap:wrap;gap:8px}.timeline-skills span{border:1px solid color-mix(in srgb,var(--primary,#0f172a) 30%, #cbd5e1);background:color-mix(in srgb,var(--primary,#0f172a) 6%, #f8fafc);border-radius:999px;padding:4px 10px;font-size:11px;color:var(--primary,#334155)}`
  },
  {
    templateId: 6,
    name: 'Creative Teal',
    htmlLayout: `<div class="teal-resume">
  <header class="teal-header">
    <h1 class="teal-name">{{fullName}}</h1>
    <p class="teal-role">{{jobTitle}}</p>
    <div class="teal-contact">{{location}} | {{email}} | {{website}}</div>
  </header>

  <p class="teal-intro">{{{summary}}}</p>

  <div class="teal-grid">
    <main>
      <section class="section expertise">
        <h2>Area of Expertise</h2>
        <div class="teal-pills">{{#expertise}}<span>{{name}}</span>{{/expertise}}</div>
      </section>

      <section class="section achievements">
        <h2>Key Achievements</h2>
        <ul>{{#achievements}}<li><strong>{{title}}.</strong> {{description}}</li>{{/achievements}}</ul>
      </section>

      <section class="section experience">
        <h2>Professional Experience</h2>
        {{#experience}}
        <article class="teal-block">
          <div class="teal-row">
            <strong>{{role}}, {{company}}</strong>
            <span>{{startDate}} - {{endDate}}</span>
          </div>
          <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
        </article>
        {{/experience}}
      </section>

      <section class="section experience">
        <h2>Projects</h2>
        {{#projects}}
        <article class="teal-block">
          <div class="teal-row">
            <strong>{{title}}</strong>
            <span>{{dates}}</span>
          </div>
          <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
        </article>
        {{/projects}}
      </section>

      <section class="section education">
        <h2>Education</h2>
        {{#education}}
        <article class="teal-block">
          <div class="teal-row">
            <strong>{{degree}}</strong>
            <span>{{startYear}} - {{endYear}}</span>
          </div>
          <div>{{institution}}</div>
        </article>
        {{/education}}
      </section>
    </main>

    <aside>
      <section class="section additional">
        <h2>Certifications</h2>
        <ul>{{#certifications}}<li><strong>{{name}}</strong> {{date}}</li>{{/certifications}}</ul>
      </section>

      <section class="section additional">
        <h2>Additional Information</h2>
        <ul>{{#additionalInfo}}<li><strong>{{label}}:</strong> {{value}}</li>{{/additionalInfo}}</ul>
      </section>
    </aside>
  </div>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:"DM Sans",Arial,sans-serif}.teal-resume{max-width:820px;margin:0 auto;padding:40px;background:#fff}.teal-header{padding-bottom:14px;border-bottom:2px solid var(--primary,#111);margin-bottom:16px}.teal-name{margin:0 0 4px;font-size:28px;letter-spacing:.04em;text-transform:uppercase;color:var(--primary,#111)}.teal-role{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#4b5563}.teal-contact{font-size:11px;color:#6b7280}.teal-intro{margin:0 0 20px;font-size:11.5px;color:#374151}.teal-grid{display:grid;grid-template-columns:1fr 220px;gap:28px}.section{margin-bottom:20px}.section h2{margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--primary,#0d9488);padding-bottom:5px;color:var(--primary,#0d9488)}.teal-pills{display:flex;flex-wrap:wrap;gap:8px}.teal-pills span{border:1px solid color-mix(in srgb,var(--primary,#0d9488) 35%, white);background:color-mix(in srgb,var(--primary,#0d9488) 10%, white);border-radius:999px;padding:4px 10px;font-size:10.5px;color:var(--primary,#0d9488)}.teal-row{display:flex;justify-content:space-between;gap:12px}.teal-block{margin-bottom:12px}.teal-block ul,.achievements ul,.additional ul{margin:6px 0 0;padding-left:18px}.teal-block li,.achievements li,.additional li{margin-bottom:4px;font-size:11px}`
  }
];

/**
 * Resolves a template fallback based on the provided Template model.
 * 
 * The resolution logic follows this priority:
 * 1. Match by exact templateId.
 * 2. Match by exact template name (case-insensitive).
 * 3. Return null if no match is found.
 * 
 * @param template The template object to resolve a fallback for.
 * @returns The matching TemplateFallback or null.
 */
export function resolveTemplateFallback(template: Template | null | undefined): TemplateFallback | null {
  if (!template) {
    return null;
  }

  // Attempt to find by ID first
  const byId = TEMPLATE_FALLBACKS.find((item) => item.templateId === template.templateId);
  if (byId) {
    return byId;
  }

  // Fallback to finding by Name (case-insensitive)
  const byName = TEMPLATE_FALLBACKS.find((item) => item.name.toLowerCase() === template.name.toLowerCase());
  return byName || null;
}

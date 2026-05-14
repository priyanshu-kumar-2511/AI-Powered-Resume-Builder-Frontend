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
      {{#phone}}<span>{{phone}}</span>{{/phone}}
      {{#email}}<span>{{email}}</span>{{/email}}
      {{#location}}<span>{{location}}</span>{{/location}}
      {{#linkedin}}<span>{{linkedin}}</span>{{/linkedin}}
      {{#github}}<span>{{github}}</span>{{/github}}
      {{#website}}<span>{{website}}</span>{{/website}}
    </div>
  </header>

  {{#sections}}
  <div style="{{{computedStyle}}}">
    {{#isSummary}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      <p class="summary-text">{{{summary}}}</p>
    </section>
    {{/isSummary}}

    {{#isEducation}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      {{#items}}
      <div class="edu-item">
        <div class="edu-row">
          <strong class="edu-degree">{{degree}} {{#fieldOfStudy}}in {{fieldOfStudy}}{{/fieldOfStudy}}</strong>
          <span class="edu-dates">{{startYear}} - {{endYear}}</span>
        </div>
        <div class="edu-row">
          <span class="edu-institution">{{institution}}</span>
          {{#grade}}<span class="edu-grade">Grade: {{grade}}</span>{{/grade}}
        </div>
      </div>
      {{/items}}
    </section>
    {{/isEducation}}

    {{#isSkills}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      <ul class="bullet-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        {{#items}}<li>{{name}}</li>{{/items}}
      </ul>
    </section>
    {{/isSkills}}

    {{#isExperience}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      {{#items}}
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
      {{/items}}
    </section>
    {{/isExperience}}

    {{#isProjects}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      {{#items}}
      <div class="project-item">
        <div class="project-header">
          <strong>{{title}}</strong>
          <span class="exp-dates">{{dates}}</span>
        </div>
        <ul class="bullet-list">
          {{#bullets}}<li>{{text}}</li>{{/bullets}}
        </ul>
      </div>
      {{/items}}
    </section>
    {{/isProjects}}

    {{#isCertifications}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      {{#items}}
      <div class="cert-row">
        <span>- {{name}} {{#issuer}}({{issuer}}){{/issuer}}</span>
        <span class="exp-dates">{{date}}</span>
      </div>
      {{/items}}
    </section>
    {{/isCertifications}}

    {{#isCustom}}
    <section class="section">
      <h2 class="section-title">{{title}}</h2>
      {{#isStructured}}
        {{#items}}
        <div class="exp-item">
          <div class="exp-header">
            <strong>{{role}} at {{company}}</strong>
            <span class="exp-dates">{{startDate}} - {{endDate}}</span>
          </div>
          <ul class="bullet-list">
            {{#bullets}}<li>{{text}}</li>{{/bullets}}
          </ul>
        </div>
        {{/items}}
      {{/isStructured}}
      {{^isStructured}}
        <p class="summary-text">{{{value}}}</p>
      {{/isStructured}}
    </section>
    {{/isCustom}}
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box;margin:0;padding:0}body{margin:0;padding:0;min-height:100vh;background:#fff}.resume{font-family:"Times New Roman",Times,serif;width:100%;margin:0 auto;padding:30px 20px;color:#111;font-size:12.5px;line-height:1.45;background:#fff}.header{text-align:center;margin-bottom:12px}.name{font-size:2.2em;font-weight:700;letter-spacing:.01em;margin-bottom:4px;color:#000;text-transform:uppercase}.contact-bar{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;font-size:0.9em;color:#333;padding:4px 0;margin-bottom:10px}.section{margin-bottom:15px}.section-title{font-size:1.05em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#000;border-top:1.5px solid #000;padding-top:3px;margin-bottom:8px}.summary-text{font-size:0.95em}.edu-item{margin-bottom:6px}.edu-row{display:flex;justify-content:space-between}.edu-degree{font-weight:700}.edu-institution{color:#333}.edu-dates,.edu-grade{font-size:0.9em;color:#444}.exp-item,.project-item{margin-bottom:10px}.exp-header,.project-header{display:flex;justify-content:space-between;align-items:baseline}.exp-company{font-weight:700}.exp-role{font-style:italic;font-size:0.95em;margin:1px 0 3px}.exp-dates{font-size:0.9em;color:#444}.bullet-list{padding-left:16px;margin-top:3px}.bullet-list li{margin-bottom:2px;font-size:0.95em}.cert-row{display:flex;justify-content:space-between;font-size:0.95em;margin-bottom:3px}`
  },
  {
    templateId: 2,
    name: 'Corporate Clean',
    htmlLayout: `<div class="resume">
  <header class="header">
    <h1 class="name">{{fullName}}</h1>
    <p class="job-title">{{jobTitle}}</p>
    <div class="contact-line">
      {{#email}}{{email}}{{/email}}{{#phone}} | {{phone}}{{/phone}}{{#location}} | {{location}}{{/location}}
      {{#linkedin}} | {{linkedin}}{{/linkedin}}{{#github}} | {{github}}{{/github}}{{#website}} | {{website}}{{/website}}
    </div>
  </header>

  {{#sections}}
  <div style="{{{computedStyle}}}">
    {{#isSummary}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      <p class="summary-text">{{{summary}}}</p>
    </section>
    {{/isSummary}}

    {{#isExperience}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      {{#items}}
      <div class="exp-item">
        <div class="exp-header">
          <strong class="exp-role">{{role}}, {{company}}</strong>
          <span class="exp-dates">{{startDate}} - {{endDate}}</span>
        </div>
        <ul class="bullet-list">
          {{#bullets}}<li>{{text}}</li>{{/bullets}}
        </ul>
      </div>
      {{/items}}
    </section>
    {{/isExperience}}

    {{#isProjects}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      {{#items}}
      <div class="exp-item">
        <div class="exp-header">
          <strong class="exp-role">{{title}}</strong>
          <span class="exp-dates">{{dates}}</span>
        </div>
        <ul class="bullet-list">
          {{#bullets}}<li>{{text}}</li>{{/bullets}}
        </ul>
      </div>
      {{/items}}
    </section>
    {{/isProjects}}

    {{#isCertifications}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      {{#items}}
      <div class="exp-item" style="margin-bottom: 8px;">
        <div class="exp-header">
          <strong class="exp-role">{{name}} {{#issuer}}({{issuer}}){{/issuer}}</strong>
          <span class="exp-dates">{{date}}</span>
        </div>
      </div>
      {{/items}}
    </section>
    {{/isCertifications}}

    {{#isEducation}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      {{#items}}
      <div class="edu-item">
        <div class="edu-header">
          <strong>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}</strong>
          <span class="exp-dates">{{startYear}} - {{endYear}}</span>
        </div>
        <div class="edu-row" style="display:flex; justify-content:space-between; margin-bottom:4px">
          <div class="edu-institution">{{institution}}</div>
          {{#grade}}<div class="edu-grade">Grade: {{grade}}</div>{{/grade}}
        </div>
        <ul class="bullet-list">
          {{#highlights}}<li>{{text}}</li>{{/highlights}}
        </ul>
      </div>
      {{/items}}
    </section>
    {{/isEducation}}

    {{#isSkills}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      <div class="skills-grid">
        {{#items}}<span class="skill-item">- {{name}}</span>{{/items}}
      </div>
    </section>
    {{/isSkills}}

    {{#isCustom}}
    <section class="section">
      <div class="section-title-bar"><h2>{{title}}</h2></div>
      {{#isStructured}}
        {{#items}}
        <div class="exp-item">
          <div class="exp-header">
            <strong class="exp-role">{{role}} {{company}}</strong>
            <span class="exp-dates">{{startDate}} - {{endDate}}</span>
          </div>
          <ul class="bullet-list">
            {{#bullets}}<li>{{text}}</li>{{/bullets}}
          </ul>
        </div>
        {{/items}}
      {{/isStructured}}
      {{^isStructured}}
        <p class="summary-text">{{{value}}}</p>
      {{/isStructured}}
    </section>
    {{/isCustom}}
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box;margin:0;padding:0}body{margin:0;padding:0;min-height:100vh;background:#fff}.resume{font-family:"Inter",Arial,sans-serif;width:100%;margin:0 auto;padding:40px 20px;color:#111;font-size:13px;line-height:1.6;background:#fff}.header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid var(--primary,#2563eb)}.name{font-size:2.2em;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;color:#111}.job-title{font-size:1em;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#4b5563;margin-bottom:8px}.contact-line{font-size:0.95em;color:#6b7280}.section{margin-bottom:20px}.section-title-bar h2{font-size:0.95em;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary,#2563eb);margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}.exp-item,.edu-item{margin-bottom:14px}.exp-header,.edu-header{display:flex;justify-content:space-between;align-items:baseline}.exp-role{font-weight:700;font-size:1em}.exp-dates{font-size:0.9em;color:#6b7280}.edu-institution{font-size:0.95em;color:#333;margin:3px 0}.bullet-list{padding-left:18px;margin-top:6px}.bullet-list li{margin-bottom:4px;font-size:0.95em}.skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px}.skill-item{font-size:0.95em}`
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
      {{#email}}<p>{{email}}</p>{{/email}}
      {{#phone}}<p>{{phone}}</p>{{/phone}}
      {{#location}}<p>{{location}}</p>{{/location}}
      {{#linkedin}}<p>{{linkedin}}</p>{{/linkedin}}
      {{#github}}<p>{{github}}</p>{{/github}}
      {{#website}}<p>{{website}}</p>{{/website}}
    </div>

    {{#sections}}
    <div style="{{{computedStyle}}}">
      {{#isSkills}}
      <div class="side-section">
        <h3>{{title}}</h3>
        <ul class="skills-list">
          {{#items}}<li>{{name}}</li>{{/items}}
        </ul>
      </div>
      {{/isSkills}}

      {{#isEducation}}
      <div class="side-section">
        <h3>{{title}}</h3>
        {{#items}}
        <div class="side-edu">
          <strong class="side-degree">{{degree}}</strong>
          {{#fieldOfStudy}}<div class="side-inst" style="font-style:italic">{{fieldOfStudy}}</div>{{/fieldOfStudy}}
          <div class="side-inst">{{institution}}</div>
          {{#grade}}<div class="side-inst">Grade: {{grade}}</div>{{/grade}}
          <span class="side-dates">{{startYear}} - {{endYear}}</span>
        </div>
        {{/items}}
      </div>
      {{/isEducation}}

      {{#isCertifications}}
      <div class="side-section">
        <h3>{{title}}</h3>
        {{#items}}
        <div class="side-edu">
          <strong class="side-degree">{{name}}</strong>
          {{#issuer}}<div class="side-inst">{{issuer}}</div>{{/issuer}}
          <span class="side-dates">{{date}}</span>
        </div>
        {{/items}}
      </div>
      {{/isCertifications}}
    </div>
    {{/sections}}
  </div>

  <div class="main-content">
    {{#sections}}
    <div style="{{{computedStyle}}}">
      {{#isSummary}}
      <section class="main-section">
        <h2>{{title}}</h2>
        <p>{{{summary}}}</p>
      </section>
      {{/isSummary}}

      {{#isExperience}}
      <section class="main-section">
        <h2>{{title}}</h2>
        {{#items}}
        <div class="exp-block">
          <div class="exp-meta">
            <strong>{{role}}, {{company}}</strong>
            <span class="exp-dates">{{startDate}} - {{endDate}}</span>
          </div>
          <ul class="main-bullets">
            {{#bullets}}<li>{{text}}</li>{{/bullets}}
          </ul>
        </div>
        {{/items}}
      </section>
      {{/isExperience}}

      {{#isProjects}}
      <section class="main-section">
        <h2>{{title}}</h2>
        {{#items}}
        <div class="exp-block">
          <div class="exp-meta">
            <strong>{{title}}</strong>
            <span class="exp-dates">{{dates}}</span>
          </div>
          <ul class="main-bullets">
            {{#bullets}}<li>{{text}}</li>{{/bullets}}
          </ul>
        </div>
        {{/items}}
      </section>
      {{/isProjects}}

      {{#isCustom}}
      <section class="main-section">
        <h2>{{title}}</h2>
        {{#isStructured}}
          {{#items}}
          <div class="exp-block">
            <div class="exp-meta">
              <strong>{{role}} at {{company}}</strong>
              <span class="exp-dates">{{startDate}} - {{endDate}}</span>
            </div>
            <ul class="main-bullets">
              {{#bullets}}<li>{{text}}</li>{{/bullets}}
            </ul>
          </div>
          {{/items}}
        {{/isStructured}}
        {{^isStructured}}
          <p class="summary-text">{{{value}}}</p>
        {{/isStructured}}
      </section>
      {{/isCustom}}
    </div>
    {{/sections}}
  </div>
</div>`,
    cssStyles: `*{box-sizing:border-box;margin:0;padding:0}body{margin:0;padding:0;min-height:100vh;background:#fff}.creative-resume{display:grid;grid-template-columns:260px 1fr;width:100%;min-height:100vh;font-family:"Outfit",sans-serif;font-size:13px;background:#fff}.sidebar{background:#111827;color:#fff;padding:36px 20px}.name{font-size:1.7em;font-weight:700;color:#fff;margin-bottom:5px;line-height:1.2}.title{font-size:0.9em;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:28px}.side-section{margin-bottom:24px}.side-section h3{font-size:0.75em;text-transform:uppercase;letter-spacing:.12em;color:var(--primary,#60a5fa);border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:5px;margin-bottom:10px}.side-section p{font-size:0.9em;color:#d1d5db;margin-bottom:6px}.skills-list{list-style:none}.skills-list li{background:rgba(255,255,255,.06);margin-bottom:5px;padding:4px 10px;border-radius:4px;font-size:0.9em;color:#e5e7eb}.side-edu{margin-bottom:10px}.side-degree{display:block;font-size:0.9em;font-weight:600;color:#fff}.side-inst{display:block;font-size:0.85em;color:#9ca3af}.side-dates{font-size:0.85em;color:#6b7280}.main-content{padding:36px 25px;background:#fff}.main-section{margin-bottom:22px}.main-section h2{font-size:1.1em;font-weight:700;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e5e7eb;padding-bottom:5px;margin-bottom:12px;color:#111}.expertise-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:0.95em;color:#374151}.expertise-grid span{background:color-mix(in srgb,var(--primary,#60a5fa) 8%,transparent);border:1px solid color-mix(in srgb,var(--primary,#60a5fa) 35%,transparent);border-radius:5px;padding:4px 8px;font-size:0.85em;font-weight:600;color:var(--primary,#1e40af);text-align:center;display:block}.exp-block{margin-bottom:14px}.exp-meta{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}.exp-meta strong{font-size:1em;color:#111}.exp-dates{font-size:0.9em;color:#6b7280}.main-bullets{padding-left:16px}.main-bullets li{margin-bottom:4px;font-size:0.95em;color:#374151}`
  },
  {
    templateId: 4,
    name: 'Executive Navy',
    htmlLayout: `<div class="navy-resume">
  <header class="navy-header">
    <h1 class="navy-name">{{fullName}}</h1>
    <div class="navy-contact">
      {{#email}}{{email}}{{/email}}{{#phone}} | {{phone}}{{/phone}}{{#location}} | {{location}}{{/location}}
      {{#linkedin}} | {{linkedin}}{{/linkedin}}{{#github}} | {{github}}{{/github}}{{#website}} | {{website}}{{/website}}
    </div>
  </header>

  {{#sections}}
  <div style="{{{computedStyle}}}">
    {{#isSummary}}
    <section class="section summary">
      <h2>{{title}}</h2>
      <p>{{{summary}}}</p>
    </section>
    {{/isSummary}}

    {{#isExperience}}
    <section class="section experience">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="navy-block">
        <div class="navy-row">
          <strong>{{role}}</strong>
          <span>{{startDate}} - {{endDate}}</span>
        </div>
        <div class="navy-company">{{company}}</div>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </article>
      {{/items}}
    </section>
    {{/isExperience}}

    {{#isProjects}}
    <section class="section experience">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="navy-block">
        <div class="navy-row">
          <strong>{{title}}</strong>
          <span>{{dates}}</span>
        </div>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </article>
      {{/items}}
    </section>
    {{/isProjects}}

    {{#isEducation}}
    <section class="section education">
      <h2>{{title}}</h2>
      {{#items}}
      <div class="navy-edu">
        <div class="navy-row">
          <strong class="navy-degree">{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}</strong>
          <span class="navy-dates">{{startYear}} - {{endYear}}</span>
        </div>
        <div class="navy-row">
          <div class="navy-inst">{{institution}}</div>
          {{#grade}}<div class="navy-grade">GPA: {{grade}}</div>{{/grade}}
        </div>
      </div>
      {{/items}}
    </section>
    {{/isEducation}}

    {{#isSkills}}
    <section class="section skills">
      <h2>{{title}}</h2>
      <ul class="navy-list">{{#items}}<li>{{name}}</li>{{/items}}</ul>
    </section>
    {{/isSkills}}

    {{#isCertifications}}
    <section class="section certifications">
      <h2>{{title}}</h2>
      <ul class="navy-list">
        {{#items}}<li><strong>{{name}}</strong> {{#issuer}}- {{issuer}}{{/issuer}} <span class="navy-muted">{{date}}</span></li>{{/items}}
      </ul>
    </section>
    {{/isCertifications}}

    {{#isCustom}}
    <section class="section">
      <h2>{{title}}</h2>
      {{#isStructured}}
        {{#items}}
        <article class="navy-block">
          <div class="navy-row">
            <strong>{{role}} at {{company}}</strong>
            <span>{{startDate}} - {{endDate}}</span>
          </div>
          <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
        </article>
        {{/items}}
      {{/isStructured}}
      {{^isStructured}}
        <p>{{{value}}}</p>
      {{/isStructured}}
    </section>
    {{/isCustom}}
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;padding:0;min-height:100vh;background:#fff;color:#111;font-family:Inter,Arial,sans-serif}.navy-resume{width:100%;margin:0 auto;padding:0 0 36px}.navy-header{background:linear-gradient(135deg,color-mix(in srgb,var(--primary,#0f172a) 26%, #0f172a),#0f172a);color:#fff;text-align:center;padding:36px 20px 28px;margin-bottom:24px}.navy-name{margin:0 0 8px;font-size:2.6em;letter-spacing:.08em;text-transform:uppercase}.navy-contact{font-size:0.85em;color:#cbd5e1}.section{padding:0 20px;margin-bottom:22px}.section h2{margin:0 0 12px;font-size:0.9em;color:var(--primary,#0891b2);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #dbe4ee;padding-bottom:5px}.navy-block{margin-bottom:14px}.navy-row{display:flex;justify-content:space-between;gap:12px}.navy-company{margin:3px 0 6px;color:var(--primary,#0891b2);font-weight:600}.navy-block ul{margin:6px 0 0;padding-left:18px}.navy-muted{color:#64748b;font-size:0.85em}.navy-list{margin:0;padding-left:18px}`
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
      {{#phone}}<span>{{phone}}</span>{{/phone}}
      {{#email}}<span>{{email}}</span>{{/email}}
      {{#location}}<span>{{location}}</span>{{/location}}
      {{#linkedin}}<span>{{linkedin}}</span>{{/linkedin}}
      {{#github}}<span>{{github}}</span>{{/github}}
      {{#website}}<span>{{website}}</span>{{/website}}
    </div>
  </header>

  {{#sections}}
  <div style="{{{computedStyle}}}">
    {{#isSummary}}
    <section class="section summary">
      <h2>{{title}}</h2>
      <p>{{{summary}}}</p>
    </section>
    {{/isSummary}}

    {{#isEducation}}
    <section class="section education">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="timeline-item">
        <div class="timeline-left">
          <strong>{{startYear}} - {{endYear}}</strong>
          {{#grade}}<span>Grade: {{grade}}</span>{{/grade}}
        </div>
        <div class="timeline-right">
          <strong>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}</strong>
          <span>{{institution}}</span>
        </div>
      </article>
      {{/items}}
    </section>
    {{/isEducation}}

    {{#isExperience}}
    <section class="section experience">
      <h2>{{title}}</h2>
      {{#items}}
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
      {{/items}}
    </section>
    {{/isExperience}}

    {{#isProjects}}
    <section class="section experience">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="timeline-item">
        <div class="timeline-left">
          <strong>{{dates}}</strong>
        </div>
        <div class="timeline-right">
          <strong>{{title}}</strong>
          <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
        </div>
      </article>
      {{/items}}
    </section>
    {{/isProjects}}

    {{#isCertifications}}
    <section class="section experience">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="timeline-item">
        <div class="timeline-left">
          <strong>{{date}}</strong>
        </div>
        <div class="timeline-right">
          <strong>{{name}}</strong>
          {{#issuer}}<div>{{issuer}}</div>{{/issuer}}
        </div>
      </article>
      {{/items}}
    </section>
    {{/isCertifications}}

    {{#isSkills}}
    <section class="section skills">
      <h2>{{title}}</h2>
      <div class="timeline-skills">{{#items}}<span>{{name}}</span>{{/items}}</div>
    </section>
    {{/isSkills}}

    {{#isCustom}}
    <section class="section">
      <h2>{{title}}</h2>
      {{#isStructured}}
        {{#items}}
        <article class="timeline-item">
          <div class="timeline-left">
            <strong>{{startDate}} - {{endDate}}</strong>
            <span>{{company}}</span>
          </div>
          <div class="timeline-right">
            <strong>{{role}}</strong>
            <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
          </div>
        </article>
        {{/items}}
      {{/isStructured}}
      {{^isStructured}}
        <p>{{{value}}}</p>
      {{/isStructured}}
    </section>
    {{/isCustom}}
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;padding:0;min-height:100vh;background:#fff;color:#1f2937;font-family:Raleway,Arial,sans-serif}.timeline-resume{width:100%;margin:0 auto;padding:40px 20px;background:#fff}.timeline-header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid var(--primary,#0f172a);padding-bottom:18px;margin-bottom:24px}.timeline-name{margin:0 0 4px;font-size:2.3em;letter-spacing:.08em;text-transform:uppercase;color:var(--primary,#0f172a)}.timeline-role{margin:0;color:#64748b;text-transform:uppercase;letter-spacing:.16em;font-size:0.85em}.timeline-contact{display:flex;flex-direction:column;gap:5px;font-size:0.85em;color:#475569}.section{margin-bottom:22px;position:relative}.section h2{margin:0 0 14px;font-size:0.9em;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #cbd5e1;padding-bottom:4px;color:var(--primary,#0f172a)}.timeline-item{display:grid;grid-template-columns:170px 1fr;gap:18px;margin-bottom:18px;position:relative}.timeline-item::before{content:"";position:absolute;left:161px;top:0;bottom:0;width:2px;background:#e5e7eb}.timeline-item::after{content:"";position:absolute;left:158px;top:6px;width:8px;height:8px;background:var(--primary,#0f172a);border-radius:50%;z-index:1}.timeline-left{display:flex;flex-direction:column;gap:3px;font-size:0.85em;color:#64748b;text-align:right;padding-right:20px}.timeline-right strong{display:block;margin-bottom:4px}.timeline-right p{margin:0;font-size:0.9em;color:#475569}.timeline-right ul{margin:4px 0 0;padding-left:16px;font-size:0.9em;color:#475569}.timeline-skills{display:flex;flex-wrap:wrap;gap:8px}.timeline-skills span{border:1px solid color-mix(in srgb,var(--primary,#0f172a) 30%, #cbd5e1);background:color-mix(in srgb,var(--primary,#0f172a) 6%, #f8fafc);border-radius:999px;padding:4px 10px;font-size:0.85em;color:var(--primary,#334155)}`
  },
  {
    templateId: 6,
    name: 'Creative Teal',
    htmlLayout: `<div class="teal-resume">
  <header class="teal-header">
    <h1 class="teal-name">{{fullName}}</h1>
    <p class="teal-role">{{jobTitle}}</p>
    <div class="teal-contact">
      {{#location}}{{location}}{{/location}}{{#email}} | {{email}}{{/email}}{{#website}} | {{website}}{{/website}}
      {{#linkedin}} | {{linkedin}}{{/linkedin}}{{#github}} | {{github}}{{/github}}
    </div>
  </header>

  <p class="teal-intro">{{{summary}}}</p>

  <div class="teal-grid">
    <main>
      {{#sections}}
      <div style="{{{computedStyle}}}">
        {{#isSummary}}
        <section class="section">
          <h2>{{title}}</h2>
          <p>{{{summary}}}</p>
        </section>
        {{/isSummary}}

        {{#isExperience}}
        <section class="section experience">
          <h2>{{title}}</h2>
          {{#items}}
          <article class="teal-block">
            <div class="teal-row">
              <strong>{{role}}, {{company}}</strong>
              <span>{{startDate}} - {{endDate}}</span>
            </div>
            <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
          </article>
          {{/items}}
        </section>
        {{/isExperience}}

        {{#isProjects}}
        <section class="section experience">
          <h2>{{title}}</h2>
          {{#items}}
          <article class="teal-block">
            <div class="teal-row">
              <strong>{{title}}</strong>
              <span>{{dates}}</span>
            </div>
            <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
          </article>
          {{/items}}
        </section>
        {{/isProjects}}

        {{#isEducation}}
        <section class="section education">
          <h2>{{title}}</h2>
          {{#items}}
          <article class="teal-block">
            <div class="teal-row">
              <strong>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}</strong>
              <span>{{startYear}} - {{endYear}}</span>
            </div>
            <div class="teal-row">
              <div>{{institution}}</div>
              {{#grade}}<div>Grade: {{grade}}</div>{{/grade}}
            </div>
          </article>
          {{/items}}
        </section>
        {{/isEducation}}

        {{#isCustom}}
        <section class="section">
          <h2>{{title}}</h2>
          {{#isStructured}}
            {{#items}}
            <article class="teal-block">
              <div class="teal-row">
                <strong>{{role}} at {{company}}</strong>
                <span>{{startDate}} - {{endDate}}</span>
              </div>
              <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
            </article>
            {{/items}}
          {{/isStructured}}
          {{^isStructured}}
            <p>{{{value}}}</p>
          {{/isStructured}}
        </section>
        {{/isCustom}}
      </div>
      {{/sections}}
    </main>

    <aside>
      {{#sections}}
      <div style="{{{computedStyle}}}">
        {{#isSkills}}
        <section class="section additional">
          <h2>{{title}}</h2>
          <div class="teal-pills">{{#items}}<span>{{name}}</span>{{/items}}</div>
        </section>
        {{/isSkills}}

        {{#isCertifications}}
        <section class="section additional">
          <h2>{{title}}</h2>
          <ul>{{#items}}<li><strong>{{name}}</strong> {{#issuer}}({{issuer}}){{/issuer}} {{date}}</li>{{/items}}</ul>
        </section>
        {{/isCertifications}}
      </div>
      {{/sections}}
    </aside>
  </div>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;padding:0;min-height:100vh;background:#fff;color:#111;font-family:"DM Sans",Arial,sans-serif}.teal-resume{width:100%;margin:0 auto;padding:0 0 40px;background:#fff}.teal-header{background:var(--primary,#0d9488);color:#fff;padding:40px 25px 30px;margin-bottom:24px;text-align:left}.teal-name{margin:0 0 8px;font-size:2.6em;letter-spacing:.04em;text-transform:uppercase;color:#fff;font-weight:800}.teal-role{margin:0 0 10px;font-size:1.1em;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,0.85)}.teal-contact{font-size:0.9em;color:rgba(255,255,255,0.75)}.teal-intro{margin:0 25px 25px;font-size:0.95em;color:#374151;line-height:1.6}.teal-grid{display:grid;grid-template-columns:1fr 240px;gap:32px;padding:0 25px}.section{margin-bottom:24px}.section h2{margin:0 0 12px;font-size:0.9em;text-transform:uppercase;letter-spacing:.12em;border-bottom:2px solid var(--primary,#0d9488);padding-bottom:6px;color:var(--primary,#0d9488);font-weight:700}.teal-pills{display:flex;flex-wrap:wrap;gap:8px}.teal-pills span{border:1px solid color-mix(in srgb,var(--primary,#0d9488) 35%, white);background:color-mix(in srgb,var(--primary,#0d9488) 10%, white);border-radius:999px;padding:4px 12px;font-size:0.85em;color:var(--primary,#0d9488)}.teal-row{display:flex;justify-content:space-between;gap:12px;margin-bottom:4px}.teal-block{margin-bottom:16px}.teal-block ul,.achievements ul,.additional ul{margin:6px 0 0;padding-left:18px}.teal-block li,.achievements li,.additional li{margin-bottom:5px;font-size:0.9em;color:#4b5563}`
  },
  {
    templateId: 7,
    name: 'Simple Ivory',
    htmlLayout: `<div class="ivory-resume">
  <header class="ivory-header">
    <h1>{{fullName}}</h1>
    <p>{{jobTitle}}</p>
    <div class="ivory-contact">
      {{#email}}{{email}}{{/email}}{{#phone}} | {{phone}}{{/phone}}{{#location}} | {{location}}{{/location}}
      {{#linkedin}} | {{linkedin}}{{/linkedin}}{{#github}} | {{github}}{{/github}}{{#website}} | {{website}}{{/website}}
    </div>
  </header>

  {{#sections}}
  <div style="{{{computedStyle}}}">
    {{#isSummary}}
    <section class="section summary">
      <h2>{{title}}</h2>
      <p>{{{summary}}}</p>
    </section>
    {{/isSummary}}

    {{#isExperience}}
    <section class="section experience">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="ivory-block">
        <div class="ivory-row">
          <strong>{{role}}, {{company}}</strong>
          <span>{{startDate}} - {{endDate}}</span>
        </div>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </article>
      {{/items}}
    </section>
    {{/isExperience}}

    {{#isEducation}}
    <section class="section education">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="ivory-block">
        <div class="ivory-row">
          <strong>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}</strong>
          <span>{{startYear}} - {{endYear}}</span>
        </div>
        <div>{{institution}}</div>
      </article>
      {{/items}}
    </section>
    {{/isEducation}}

    {{#isSkills}}
    <section class="section skills">
      <h2>{{title}}</h2>
      <div class="ivory-skills">{{#items}}<span>{{name}}</span>{{/items}}</div>
    </section>
    {{/isSkills}}

    {{#isProjects}}
    <section class="section projects">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="ivory-block">
        <div class="ivory-row">
          <strong>{{title}}</strong>
          <span>{{dates}}</span>
        </div>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </article>
      {{/items}}
    </section>
    {{/isProjects}}

    {{#isCertifications}}
    <section class="section certs">
      <h2>{{title}}</h2>
      {{#items}}
      <article class="ivory-block">
        <div class="ivory-row">
          <strong>{{name}} {{#issuer}}({{issuer}}){{/issuer}}</strong>
          <span>{{date}}</span>
        </div>
      </article>
      {{/items}}
    </section>
    {{/isCertifications}}

    {{#isCustom}}
    <section class="section">
      <h2>{{title}}</h2>
      {{#isStructured}}
        {{#items}}
        <article class="ivory-block">
          <div class="ivory-row">
            <strong>{{role}} at {{company}}</strong>
            <span>{{startDate}} - {{endDate}}</span>
          </div>
          <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
        </article>
        {{/items}}
      {{/isStructured}}
      {{^isStructured}}
        <p>{{{value}}}</p>
      {{/isStructured}}
    </section>
    {{/isCustom}}
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;padding:0;min-height:100vh;background:#fdfaf0;color:#333;font-family:Lora,serif}.ivory-resume{width:100%;margin:0 auto;padding:40px 20px;background:#fdfaf0}.ivory-header{text-align:center;margin-bottom:30px}.ivory-header h1{margin:0;font-size:2.3em;color:#000}.ivory-header p{margin:5px 0;font-size:1em;color:#666;text-transform:uppercase;letter-spacing:.1em}.ivory-contact{font-size:0.9em;color:#888}.section{margin-bottom:24px}.section h2{font-size:0.95em;text-transform:uppercase;letter-spacing:.12em;color:#000;padding-bottom:6px;margin-bottom:12px}.ivory-block{margin-bottom:14px}.ivory-row{display:flex;justify-content:space-between;margin-bottom:4px}.ivory-row strong{font-size:1.05em;color:#111}.ivory-row span{font-size:0.9em;color:#999}.ivory-block ul{padding-left:18px;margin-top:6px}.ivory-block li{margin-bottom:4px;font-size:0.95em}.ivory-skills{display:flex;flex-wrap:wrap;gap:12px}.ivory-skills span{font-size:0.95em}`
  },
  {
    templateId: 8,
    name: 'Clean Columns',
    htmlLayout: `<div class="resume">
  <header class="header">
    <h1 class="name">{{fullName}}</h1>
    <p class="role">{{jobTitle}}</p>
    <div class="contact">{{#email}}{{email}} | {{/email}}{{#phone}}{{phone}} | {{/phone}}{{#location}}{{location}}{{/location}}{{#linkedin}} | {{linkedin}}{{/linkedin}}{{#github}} | {{github}}{{/github}}{{#website}} | {{website}}{{/website}}</div>
  </header>
  {{#sections}}
  <div class="section" style="{{{computedStyle}}}">
    <h2>{{title}}</h2>
    {{#isSummary}}<p>{{{summary}}}</p>{{/isSummary}}
    {{#isExperience}}{{#items}}
      <div class="item">
        <div class="row"><strong>{{role}}, {{company}}</strong><span>{{startDate}} - {{endDate}}</span></div>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </div>
    {{/items}}{{/isExperience}}
    {{#isEducation}}{{#items}}
      <div class="item">
        <div class="row"><strong>{{degree}}</strong><span>{{startYear}} - {{endYear}}</span></div>
        <div>{{institution}}</div>
      </div>
    {{/items}}{{/isEducation}}
    {{#isSkills}}<div class="skills">{{#items}}<span>{{name}}</span>{{/items}}</div>{{/isSkills}}
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;padding:0;min-height:100vh;background:#fff;font-family:Inter,sans-serif}.resume{width:100%;padding:40px 25px}.header{margin-bottom:30px;border-left:4px solid var(--primary,#000);padding-left:15px}.name{font-size:2.4em;margin:0}.role{font-size:1.1em;color:#666;margin:4px 0}.contact{font-size:0.9em;color:#888}.section{margin-bottom:24px}.section h2{font-size:1em;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:12px;color:var(--primary,#000)}.item{margin-bottom:15px}.row{display:flex;justify-content:space-between;margin-bottom:4px}.skills{display:flex;flex-wrap:wrap;gap:10px}.skills span{background:#f3f4f6;padding:4px 10px;border-radius:4px;font-size:0.9em}`
  },
  {
    templateId: 9,
    name: 'Minimal Mono',
    htmlLayout: `<div class="mono-resume">
  <header class="mono-header">
    <h1>{{fullName}}</h1>
    <p>{{jobTitle}}</p>
    <div class="mono-contact">{{#email}}{{email}} | {{/email}}{{#phone}}{{phone}} | {{/phone}}{{#location}}{{location}}{{/location}}{{#linkedin}} | {{linkedin}}{{/linkedin}}{{#github}} | {{github}}{{/github}}{{#website}} | {{website}}{{/website}}</div>
  </header>
  {{#sections}}
  <div style="{{{computedStyle}}}">
    <section class="mono-section">
      <h2>// {{title}}</h2>
      {{#isSummary}}<p>{{{summary}}}</p>{{/isSummary}}
      {{#isExperience}}{{#items}}
        <div class="mono-item">
          <div class="mono-top"><strong>{{role}} @ {{company}}</strong><span>{{startDate}} -> {{endDate}}</span></div>
          <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
        </div>
      {{/items}}{{/isExperience}}
      {{#isEducation}}{{#items}}
        <div class="mono-item">
          <div class="mono-top"><strong>{{degree}}</strong><span>{{startYear}} - {{endYear}}</span></div>
          <div>{{institution}}</div>
        </div>
      {{/items}}{{/isEducation}}
      {{#isSkills}}<div class="mono-tags">{{#items}}<span>[{{name}}]</span>{{/items}}</div>{{/isSkills}}
    </section>
  </div>
  {{/sections}}
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;padding:0;min-height:100vh;background:#fff;color:#000;font-family:"Courier New",monospace}.mono-resume{width:100%;padding:40px 20px}.mono-header{margin-bottom:30px;border-bottom:1px dashed #000;padding-bottom:20px}.mono-header h1{font-size:2.2em;margin:0}.mono-header p{font-size:1.1em;margin:8px 0}.mono-contact{font-size:0.85em;color:#666}.mono-section{margin-bottom:25px}.mono-section h2{font-size:1em;text-transform:uppercase;color:#000;margin-bottom:12px}.mono-item{margin-bottom:15px}.mono-top{display:flex;justify-content:space-between;margin-bottom:5px}.mono-tags{display:flex;flex-wrap:wrap;gap:12px}ul{padding-left:20px;margin-top:5px}li{margin-bottom:4px;font-size:0.9em}`
  },
  {
    templateId: 10,
    name: 'Ankesh',
    htmlLayout: `<div class="ankesh-resume">
  <header class="ankesh-header">
    <h1 class="ankesh-name">{{fullName}}</h1>
    <div class="ankesh-contact-grid">
      {{#phone}}<div class="ankesh-contact-item"><strong>Phone:</strong> {{phone}}</div>{{/phone}}
      {{#email}}<div class="ankesh-contact-item"><strong>Email:</strong> {{email}}</div>{{/email}}
      {{#linkedin}}<div class="ankesh-contact-item"><strong>LinkedIn:</strong> <a href="https://{{linkedin}}">{{linkedin}}</a></div>{{/linkedin}}
      {{#github}}<div class="ankesh-contact-item"><strong>GitHub:</strong> <a href="https://{{github}}">{{github}}</a></div>{{/github}}
      {{#website}}<div class="ankesh-contact-item"><strong>Portfolio:</strong> <a href="https://{{website}}">{{website}}</a></div>{{/website}}
    </div>
  </header>

  {{#sections}}
  <div class="ankesh-section" style="{{{computedStyle}}}">
    <h2 class="ankesh-section-title">{{title}}</h2>
    <div class="ankesh-section-content">
      {{#isSummary}}
        <p class="ankesh-text">{{{summary}}}</p>
      {{/isSummary}}

      {{#isEducation}}
        {{#items}}
        <div class="ankesh-entry">
          <div class="ankesh-row">
            <span class="ankesh-entry-title"><strong>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}</strong></span>
            <span class="ankesh-entry-date">{{startYear}} – {{endYear}}</span>
          </div>
          <div class="ankesh-row">
            <span class="ankesh-entry-sub">{{institution}}</span>
            {{#grade}}<span class="ankesh-entry-meta">CGPA: {{grade}}</span>{{/grade}}
          </div>
        </div>
        {{/items}}
      {{/isEducation}}

      {{#isSkills}}
        <div class="ankesh-skills-container">
          <ul class="ankesh-bullets ankesh-skills-list">
            {{#items}}
              <li><strong>{{name}}:</strong> {{#details}}{{.}}{{/details}}</li>
            {{/items}}
          </ul>
        </div>
      {{/isSkills}}

      {{#isExperience}}
        {{#items}}
        <div class="ankesh-entry">
          <div class="ankesh-row">
            <span class="ankesh-entry-title"><strong>{{company}}</strong></span>
            <span class="ankesh-entry-date">{{startDate}} – {{endDate}}</span>
          </div>
          <div class="ankesh-row">
            <span class="ankesh-entry-sub">{{role}}</span>
            {{#location}}<span class="ankesh-entry-meta">{{location}}</span>{{/location}}
          </div>
          <ul class="ankesh-bullets">
            {{#bullets}}<li>{{text}}</li>{{/bullets}}
          </ul>
        </div>
        {{/items}}
      {{/isExperience}}

      {{#isProjects}}
        {{#items}}
        <div class="ankesh-entry">
          <div class="ankesh-row">
            <span class="ankesh-entry-title"><strong>{{title}}</strong></span>
            <span class="ankesh-entry-date">{{dates}}</span>
          </div>
          <ul class="ankesh-bullets">
            {{#bullets}}<li>{{text}}</li>{{/bullets}}
          </ul>
        </div>
        {{/items}}
      {{/isProjects}}

      {{#isCertifications}}
        <ul class="ankesh-bullets">
          {{#items}}
          <li>
            <div class="ankesh-row">
              <span>{{name}} {{#issuer}}({{issuer}}){{/issuer}}</span>
              <span class="ankesh-entry-date">{{date}}</span>
            </div>
          </li>
          {{/items}}
        </ul>
      {{/isCertifications}}

      {{#isCustom}}
        {{#isStructured}}
          {{#items}}
          <div class="ankesh-entry">
            <div class="ankesh-row">
              <strong>{{role}} at {{company}}</strong>
              <span>{{startDate}} - {{endDate}}</span>
            </div>
            <ul class="ankesh-bullets">{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
          </div>
          {{/items}}
        {{/isStructured}}
        {{^isStructured}}<p class="ankesh-text">{{{value}}}</p>{{/isStructured}}
      {{/isCustom}}
    </div>
  </div>
  {{/sections}}
</div>`,
    cssStyles: `.ankesh-resume{width:100%;padding:30px;background:#fff;font-family:'Segoe UI',Arial,sans-serif;color:#000;line-height:1.4}.ankesh-header{text-align:center;margin-bottom:20px}.ankesh-name{font-size:28pt;font-weight:800;text-transform:uppercase;margin-bottom:10px;letter-spacing:1px}.ankesh-contact-grid{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;font-size:9pt;border-bottom:2px solid #000;padding-bottom:10px}.ankesh-contact-item a{color:#000;text-decoration:underline}.ankesh-section{margin-bottom:15px}.ankesh-section-title{font-size:14pt;font-weight:800;text-transform:uppercase;border-bottom:1.5px solid #000;padding-bottom:2px;margin-bottom:8px}.ankesh-text{font-size:10.5pt;text-align:justify}.ankesh-entry{margin-bottom:10px}.ankesh-row{display:flex;justify-content:space-between;align-items:baseline;font-size:11pt}.ankesh-entry-title{font-size:11pt}.ankesh-entry-sub{font-size:10.5pt}.ankesh-entry-date,.ankesh-entry-meta{font-size:10pt;color:#333}.ankesh-bullets{margin:5px 0;padding-left:20px;list-style-type:disc}.ankesh-bullets li{font-size:10.5pt;margin-bottom:3px}.ankesh-skills-list{display:grid;grid-template-columns:1fr 1fr;gap:10px;list-style:none;padding-left:0}`
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
    return TEMPLATE_FALLBACKS[0] || null;
  }

  // Attempt to find by ID first
  const byId = TEMPLATE_FALLBACKS.find((item) => item.templateId === template.templateId);
  if (byId) {
    return byId;
  }

  // Fallback to finding by Name (case-insensitive)
  const byName = TEMPLATE_FALLBACKS.find((item) => 
    item.name && template.name && item.name.toLowerCase() === template.name.toLowerCase()
  );
  return byName || null;
}

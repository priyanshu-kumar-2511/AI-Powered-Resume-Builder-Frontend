import { Template } from '../models/models';

type TemplateFallback = {
  templateId?: number;
  name: string;
  htmlLayout: string;
  cssStyles: string;
};

const TEMPLATE_FALLBACKS: TemplateFallback[] = [
  {
    templateId: 1,
    name: 'Classic ATS',
    htmlLayout: `<div class="ats-resume">
  <header class="ats-header">
    <h1 class="ats-name">{{fullName}}</h1>
    <div class="ats-contact">
      <span>{{phone}}</span>
      <span>{{email}}</span>
      <span>{{linkedin}}</span>
      <span>{{github}}</span>
    </div>
  </header>

  <section class="section summary">
    <h2>Professional Summary</h2>
    <p>{{{summary}}}</p>
  </section>

  <section class="section experience">
    <h2>Experience</h2>
    {{#experience}}
    <article class="ats-block">
      <div class="ats-row">
        <strong>{{role}} - {{company}}</strong>
        <span>{{startDate}} - {{endDate}}</span>
      </div>
      <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
    </article>
    {{/experience}}
  </section>

  <section class="section education">
    <h2>Education</h2>
    {{#education}}
    <article class="ats-block">
      <div class="ats-row">
        <strong>{{degree}}</strong>
        <span>{{startYear}} - {{endYear}}</span>
      </div>
      <div>{{institution}}</div>
    </article>
    {{/education}}
  </section>

  <section class="section skills">
    <h2>Skills</h2>
    <div class="ats-skills">{{#skills}}<span>{{name}}</span>{{/skills}}</div>
  </section>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:"Times New Roman",serif}.ats-resume{max-width:820px;margin:0 auto;padding:36px 42px;font-size:12px;line-height:1.5}.ats-header{text-align:center;margin-bottom:16px}.ats-name{font-size:28px;letter-spacing:.04em;margin:0 0 8px;color:var(--primary,#0f172a)}.ats-contact{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;border-top:1px solid var(--primary,#111);border-bottom:1px solid var(--primary,#111);padding:6px 0;font-size:11px}.section{margin-bottom:18px}.section h2{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--primary,#111);padding-bottom:4px;color:var(--primary,#111)}.ats-row{display:flex;justify-content:space-between;gap:12px;font-size:11.5px}.ats-block{margin-bottom:10px}.ats-block ul{margin:6px 0 0;padding-left:18px}.ats-block li{margin-bottom:3px}.ats-skills{display:flex;flex-wrap:wrap;gap:8px}.ats-skills span{border:1px solid color-mix(in srgb,var(--primary,#0f172a) 35%, white);color:var(--primary,#0f172a);padding:4px 8px;border-radius:4px;font-size:11px}`
  },
  {
    templateId: 2,
    name: 'Corporate Clean',
    htmlLayout: `<div class="corp-resume">
  <header class="corp-header">
    <h1 class="corp-name">{{fullName}}</h1>
    <p class="corp-role">{{jobTitle}}</p>
    <div class="corp-contact">{{email}} | {{phone}} | {{location}}</div>
  </header>

  <section class="section summary">
    <div class="corp-title-bar"><h2>Summary</h2></div>
    <p>{{{summary}}}</p>
  </section>

  <section class="section experience">
    <div class="corp-title-bar"><h2>Work Experience</h2></div>
    {{#experience}}
    <article class="corp-block">
      <div class="corp-row">
        <strong>{{role}}, {{company}}</strong>
        <span>{{startDate}} - {{endDate}}</span>
      </div>
      <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
    </article>
    {{/experience}}
  </section>

  <section class="section education">
    <div class="corp-title-bar"><h2>Education</h2></div>
    {{#education}}
    <article class="corp-block">
      <div class="corp-row">
        <strong>{{degree}}</strong>
        <span>{{startYear}} - {{endYear}}</span>
      </div>
      <div class="corp-sub">{{institution}}</div>
      <ul>{{#highlights}}<li>{{text}}</li>{{/highlights}}</ul>
    </article>
    {{/education}}
  </section>

  <section class="section skills">
    <div class="corp-title-bar"><h2>Key Skills</h2></div>
    <div class="corp-skill-grid">{{#skills}}<span>{{name}}</span>{{/skills}}</div>
  </section>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:"Open Sans",Arial,sans-serif}.corp-resume{max-width:820px;margin:0 auto;padding:40px;font-size:12px;line-height:1.6}.corp-header{text-align:center;border-bottom:2px solid var(--primary,#111);padding-bottom:16px;margin-bottom:24px}.corp-name{margin:0 0 6px;font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:var(--primary,#111)}.corp-role{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#4b5563}.corp-contact{font-size:11px;color:#6b7280}.section{margin-bottom:20px}.corp-title-bar{background:color-mix(in srgb,var(--primary,#e2e8f0) 10%, white);border-left:3px solid var(--primary,#0f172a);padding:6px 10px;margin-bottom:10px}.section h2{margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--primary,#111)}.corp-block{margin-bottom:12px}.corp-row{display:flex;justify-content:space-between;gap:12px}.corp-sub{margin-top:2px;color:#4b5563}.corp-block ul{margin:6px 0 0;padding-left:18px}.corp-skill-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.corp-skill-grid span{font-size:11px}`
  },
  {
    templateId: 3,
    name: 'Modern Sidebar',
    htmlLayout: `<div class="sidebar-resume">
  <aside class="sidebar-panel">
    <h1 class="sidebar-name">{{fullName}}</h1>
    <p class="sidebar-role">{{jobTitle}}</p>

    <section class="section contact">
      <h2>Contact</h2>
      <div class="sidebar-list">
        <span>{{email}}</span>
        <span>{{phone}}</span>
        <span>{{location}}</span>
        <span>{{linkedin}}</span>
      </div>
    </section>

    <section class="section skills">
      <h2>Skills</h2>
      <div class="sidebar-skills">{{#skills}}<span>{{name}}</span>{{/skills}}</div>
    </section>

    <section class="section education">
      <h2>Education</h2>
      {{#education}}
      <article class="side-edu">
        <strong>{{degree}}</strong>
        <span>{{institution}}</span>
        <span>{{startYear}} - {{endYear}}</span>
      </article>
      {{/education}}
    </section>
  </aside>

  <main class="sidebar-main">
    <section class="section summary">
      <h2>About Me</h2>
      <p>{{{summary}}}</p>
    </section>

    <section class="section experience">
      <h2>Professional Experience</h2>
      {{#experience}}
      <article class="main-block">
        <div class="main-row">
          <strong>{{role}}, {{company}}</strong>
          <span>{{startDate}} - {{endDate}}</span>
        </div>
        <ul>{{#bullets}}<li>{{text}}</li>{{/bullets}}</ul>
      </article>
      {{/experience}}
    </section>

    <section class="section expertise">
      <h2>Area of Expertise</h2>
      <div class="expertise-grid">{{#expertise}}<span>{{name}}</span>{{/expertise}}</div>
    </section>
  </main>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:"Outfit",Arial,sans-serif}.sidebar-resume{display:grid;grid-template-columns:240px 1fr;min-height:1120px}.sidebar-panel{background:#111827;color:#fff;padding:34px 22px}.sidebar-name{margin:0 0 6px;font-size:25px;line-height:1.15}.sidebar-role{margin:0 0 22px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.sidebar-panel .section{margin-bottom:22px}.sidebar-panel h2{margin:0 0 10px;font-size:10px;color:var(--primary,#60a5fa);text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:4px}.sidebar-list{display:flex;flex-direction:column;gap:5px;font-size:11px;color:#d1d5db}.sidebar-skills{display:flex;flex-wrap:wrap;gap:6px}.sidebar-skills span{background:color-mix(in srgb,var(--primary,#60a5fa) 18%, transparent);border:1px solid color-mix(in srgb,var(--primary,#60a5fa) 40%, transparent);padding:4px 8px;border-radius:4px;font-size:10px}.side-edu{display:flex;flex-direction:column;gap:2px;font-size:10.5px;color:#d1d5db;margin-bottom:10px}.sidebar-main{padding:36px}.sidebar-main .section{margin-bottom:24px}.sidebar-main h2{margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid color-mix(in srgb,var(--primary,#60a5fa) 30%, #e5e7eb);padding-bottom:5px;color:var(--primary,#0f172a)}.main-row{display:flex;justify-content:space-between;gap:12px}.main-block{margin-bottom:12px}.main-block ul{margin:6px 0 0;padding-left:18px}.expertise-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;font-size:11px;color:#374151}`
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

  <section class="section skills">
    <h2>Skills</h2>
    <div class="timeline-skills">{{#skills}}<span>{{name}}</span>{{/skills}}</div>
  </section>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#1f2937;font-family:Raleway,Arial,sans-serif}.timeline-resume{max-width:820px;margin:0 auto;padding:40px;border:1px solid #dbe4ee;background:#fff}.timeline-header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid var(--primary,#0f172a);padding-bottom:18px;margin-bottom:24px}.timeline-name{margin:0 0 4px;font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:var(--primary,#0f172a)}.timeline-role{margin:0;color:#64748b;text-transform:uppercase;letter-spacing:.16em;font-size:11px}.timeline-contact{display:flex;flex-direction:column;gap:5px;font-size:11px;color:#475569}.section{margin-bottom:22px}.section h2{margin:0 0 14px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #cbd5e1;padding-bottom:4px;color:var(--primary,#0f172a)}.timeline-item{display:grid;grid-template-columns:170px 1fr;gap:18px;margin-bottom:14px}.timeline-left{display:flex;flex-direction:column;gap:3px;font-size:11px;color:#64748b}.timeline-right strong{display:block;margin-bottom:4px}.timeline-right p{margin:0;font-size:11.5px;color:#475569}.timeline-skills{display:flex;flex-wrap:wrap;gap:8px}.timeline-skills span{border:1px solid color-mix(in srgb,var(--primary,#0f172a) 30%, #cbd5e1);background:color-mix(in srgb,var(--primary,#0f172a) 6%, #f8fafc);border-radius:999px;padding:4px 10px;font-size:11px;color:var(--primary,#334155)}`
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
        <h2>Additional Information</h2>
        <ul>{{#additionalInfo}}<li><strong>{{label}}:</strong> {{value}}</li>{{/additionalInfo}}</ul>
      </section>
    </aside>
  </div>
</div>`,
    cssStyles: `*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:"DM Sans",Arial,sans-serif}.teal-resume{max-width:820px;margin:0 auto;padding:40px;background:#fff}.teal-header{padding-bottom:14px;border-bottom:2px solid var(--primary,#111);margin-bottom:16px}.teal-name{margin:0 0 4px;font-size:28px;letter-spacing:.04em;text-transform:uppercase;color:var(--primary,#111)}.teal-role{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#4b5563}.teal-contact{font-size:11px;color:#6b7280}.teal-intro{margin:0 0 20px;font-size:11.5px;color:#374151}.teal-grid{display:grid;grid-template-columns:1fr 220px;gap:28px}.section{margin-bottom:20px}.section h2{margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--primary,#0d9488);padding-bottom:5px;color:var(--primary,#0d9488)}.teal-pills{display:flex;flex-wrap:wrap;gap:8px}.teal-pills span{border:1px solid color-mix(in srgb,var(--primary,#0d9488) 35%, white);background:color-mix(in srgb,var(--primary,#0d9488) 10%, white);border-radius:999px;padding:4px 10px;font-size:10.5px;color:var(--primary,#0d9488)}.teal-row{display:flex;justify-content:space-between;gap:12px}.teal-block{margin-bottom:12px}.teal-block ul,.achievements ul,.additional ul{margin:6px 0 0;padding-left:18px}.teal-block li,.achievements li,.additional li{margin-bottom:4px;font-size:11px}`
  }
];

export function resolveTemplateFallback(template: Template | null | undefined): TemplateFallback | null {
  if (!template) {
    return null;
  }

  const byId = TEMPLATE_FALLBACKS.find((item) => item.templateId === template.templateId);
  if (byId) {
    return byId;
  }

  const byName = TEMPLATE_FALLBACKS.find((item) => item.name.toLowerCase() === template.name.toLowerCase());
  return byName || null;
}

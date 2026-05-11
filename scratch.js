const Mustache = require('mustache');

const template = `
    <h2 class="section-title">Projects</h2>
    {{#projects}}
    <div class="resume-item">
      <div class="item-header">
        <h3 class="item-title">{{title}}</h3>
        <span class="item-date">{{dates}}</span>
      </div>
      <ul class="item-bullets">
        {{#bullets}}
        <li>{{text}}</li>
        {{/bullets}}
      </ul>
    </div>
    {{/projects}}
`;

const viewData = {
  projects: [
    {
      title: 'Ambu Now',
      dates: 'Jan-2022 - Present',
      bullets: []
    }
  ]
};

console.log(Mustache.render(template, viewData));

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Resume, Template } from '../../../shared/models/models';
import { TemplateService } from '../../../core/services/template.service';
import { ResumeSettingsComponent } from '../settings/resume-settings.component';

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, ResumeSettingsComponent],
  templateUrl: './resume-builder.component.html'
})
export class ResumeBuilderComponent {
  private route = inject(ActivatedRoute);
  private templateService = inject(TemplateService);
  private sanitizer = inject(DomSanitizer);

  readonly resumeId = Number(this.route.snapshot.paramMap.get('resumeId'));

  resume: Resume | null = null;
  template: Template | null = null;
  loadingTemplate = false;

  get safePreview(): SafeHtml | null {
    if (!this.template?.htmlLayout) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustHtml(
      `<style>${this.template.cssStyles || ''}</style>${this.template.htmlLayout}`
    );
  }

  handleResumeLoaded(resume: Resume): void {
    this.resume = resume;
    this.loadTemplate(resume.templateId);
  }

  private loadTemplate(templateId: number | null): void {
    if (!templateId) {
      this.template = null;
      return;
    }

    if (this.template?.templateId === templateId) {
      return;
    }

    this.loadingTemplate = true;
    this.templateService.getTemplateById(templateId).subscribe({
      next: (template) => {
        this.template = template;
        this.loadingTemplate = false;
      },
      error: () => {
        this.template = null;
        this.loadingTemplate = false;
      }
    });
  }
}

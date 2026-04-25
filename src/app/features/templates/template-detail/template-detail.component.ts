import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { Template } from '../../../shared/models/models';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './template-detail.component.html'
})
export class TemplateDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private templateSvc  = inject(TemplateService);
  private sanitizer    = inject(DomSanitizer);
  private resumeApi    = inject(ResumeApiService);
  auth                 = inject(AuthService);

  template: Template | null = null;
  loading = true;
  error   = '';
  creating = false;

  get safeHtml(): SafeHtml | null {
    if (!this.template?.htmlLayout) return null;
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>body{margin:0;padding:0;background:#fff;}</style>
          <style>${this.template.cssStyles || ''}</style>
        </head>
        <body>${this.template.htmlLayout}</body>
      </html>
    `;
    return this.sanitizer.bypassSecurityTrustHtml(fullHtml);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.templateSvc.getTemplateById(id).subscribe({
      next: (t) => { this.template = t; this.loading = false; },
      error: () => { this.error = 'Template not found.'; this.loading = false; }
    });
  }

  useTemplate() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/register']); return; }
    if (!this.template) return;

    const userId = this.auth.getCurrentUserId();
    if (userId === null) return;

    this.creating = true;
    this.templateSvc.incrementUsage(this.template.templateId).subscribe();

    this.resumeApi.create({
      userId,
      title: `${this.template.name} Resume`,
      templateId: this.template.templateId,
      targetJobTitle: '',
      language: 'en'
    }).subscribe({
      next: (resume) => {
        this.creating = false;
        this.router.navigate(['/builder', resume.resumeId]);
      },
      error: () => {
        this.creating = false;
        this.error = 'Could not create resume. Please try again.';
      }
    });
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

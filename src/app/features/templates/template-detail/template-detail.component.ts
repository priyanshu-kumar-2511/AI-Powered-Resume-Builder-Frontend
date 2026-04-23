import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
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
  auth                 = inject(AuthService);

  template: Template | null = null;
  loading = true;
  error   = '';

  get safeHtml(): SafeHtml | null {
    if (!this.template?.htmlLayout) return null;
    const fullHtml = `<style>${this.template.cssStyles || ''}</style>${this.template.htmlLayout}`;
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
    this.templateSvc.incrementUsage(this.template.templateId).subscribe();
    this.router.navigate(['/resumes/new'], { queryParams: { templateId: this.template.templateId } });
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

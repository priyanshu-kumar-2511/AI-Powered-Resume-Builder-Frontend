import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateService } from '../../../core/services/template.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { CreateResumeRequest, Template } from '../../../shared/models/models';
import Mustache from 'mustache';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './template-detail.component.html'
})
export class TemplateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templateSvc = inject(TemplateService);
  private sanitizer = inject(DomSanitizer);
  private resumeApi = inject(ResumeApiService);
  auth = inject(AuthService);

  template: Template | null = null;
  loading = true;
  error = '';
  creating = false;

  // Sample data for the template preview iframe
  private readonly previewData = {
    fullName: 'Richard Sanchez',
    jobTitle: 'Marketing Manager',
    email: 'rsanchez@email.com',
    phone: '+1 (555) 012-3456',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/rsanchez',
    summary: 'Results-driven marketing professional with 8+ years of experience leading cross-functional teams and delivering data-driven campaigns that grow revenue by 40%.',
    experience: [
      {
        role: 'Senior Marketing Manager',
        company: 'Bonsai Studio',
        startDate: 'Jan 2022',
        endDate: 'Present',
        bullets: [
          { text: 'Led a team of 12 to deliver award-winning campaigns' },
          { text: 'Grew organic traffic by 60% in 18 months' }
        ]
      },
      {
        role: 'Marketing Specialist',
        company: 'Acme Corp',
        startDate: 'Mar 2019',
        endDate: 'Dec 2021',
        bullets: [
          { text: 'Managed $500K annual advertising budget' },
          { text: 'Launched 3 product campaigns with 95% positive reception' }
        ]
      }
    ],
    education: [
      {
        degree: 'B.A. Communications',
        institution: 'Stanford University',
        startYear: '2014',
        endYear: '2018',
        grade: '3.8 GPA'
      }
    ],
    skills: [
      { name: 'Analytics' },
      { name: 'Strategy' },
      { name: 'SEO/SEM' },
      { name: 'Leadership' },
      { name: 'Content Marketing' }
    ]
  };

  get safeHtml(): SafeHtml | null {
    if (!this.template?.htmlLayout) return null;

    let renderedBody: string;
    try {
      renderedBody = Mustache.render(this.template.htmlLayout, this.previewData);
    } catch {
      renderedBody = this.template.htmlLayout;
    }

    const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>body { margin: 0; padding: 0; background: #fff; }</style>
    <style>${this.template.cssStyles || ''}</style>
  </head>
  <body>${renderedBody}</body>
</html>`;

    return this.sanitizer.bypassSecurityTrustHtml(fullHtml);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.templateSvc.getTemplateById(id).subscribe({
      next: (t) => { this.template = t; this.loading = false; },
      error: () => { this.error = 'Template not found.'; this.loading = false; }
    });
  }

  useTemplate(): void {
    if (this.creating) return;
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/register']); return; }
    if (!this.template) return;

    const userId = this.auth.getCurrentUserId();
    if (userId !== null) {
      this.doCreate(userId);
      return;
    }

    this.creating = true;
    this.error = '';
    this.auth.getProfile()
      .pipe(catchError(() => of(null)))
      .subscribe(profile => {
        const resolvedId = profile?.userId ?? this.auth.getCurrentUserId();
        if (resolvedId === null) {
          this.creating = false;
          this.error = 'Could not verify your identity. Please log out and log in again.';
          return;
        }
        this.doCreate(resolvedId);
      });
  }

  private doCreate(userId: number): void {
    this.creating = true;
    this.error = '';
    this.templateSvc.incrementUsage(this.template!.templateId)
      .subscribe({ error: () => undefined });

    const payload: CreateResumeRequest = {
      userId,
      title: `${this.template!.name} Resume`,
      templateId: this.template!.templateId,
      targetJobTitle: '',
      language: 'en'
    };

    this.resumeApi.create(payload).subscribe({
      next: (resume) => {
        this.creating = false;
        this.router.navigate(['/builder', resume.resumeId]);
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.status === 403
          ? 'Resume limit reached on the Free plan. Upgrade to Premium to create more.'
          : 'Could not create resume. Please try again.';
      }
    });
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
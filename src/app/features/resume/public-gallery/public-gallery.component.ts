import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateService } from '../../../core/services/template.service';
import { Resume, TemplateResponseDTO } from '../../../shared/models/models';
import { ResumeCardComponent } from '../card/resume-card.component';
import { ResumeApiService } from '../services/resume-api.service';
import { SectionApiService } from '../../builder/services/section-api.service';
import { ResumeSection, Template } from '../../../shared/models/models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Mustache from 'mustache';

@Component({
  selector: 'app-public-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, ResumeCardComponent],
  templateUrl: './public-gallery.component.html'
})
export class PublicGalleryComponent implements OnInit {
  private resumeApi = inject(ResumeApiService);
  private templateService = inject(TemplateService);
  private sectionApi = inject(SectionApiService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  resumes: Resume[] = [];
  templateMap = new Map<number, TemplateResponseDTO>();
  selectedResume: Resume | null = null;

  loading = true;
  error = '';
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  viewingResumeId: number | null = null;

  selectedResumeSections: ResumeSection[] = [];
  selectedFullTemplate: Template | null = null;
  previewHtml: SafeHtml | null = null;

  ngOnInit(): void {
    forkJoin({
      resumes: this.resumeApi.getPublic().pipe(catchError(() => of([] as Resume[]))),
      templates: this.templateService.getAllTemplates().pipe(catchError(() => of([] as TemplateResponseDTO[])))
    }).subscribe({
      next: ({ resumes, templates }) => {
        this.resumes = resumes.sort((left, right) => right.viewCount - left.viewCount);
        this.templateMap = new Map(templates.map((template) => [template.templateId, template]));
        // Do NOT auto-select — spotlight card only appears when user clicks "View Resume"
        this.selectedResume = null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Public gallery is unavailable right now.';
        this.loading = false;
      }
    });
  }

  get filteredResumes(): Resume[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.resumes;
    }

    return this.resumes.filter((resume) =>
      (resume.targetJobTitle || '').toLowerCase().includes(term)
      || resume.title.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredResumes.length / this.pageSize));
  }

  get paginatedResumes(): Resume[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredResumes.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  onSearchChange(): void {
    this.page = 1;
  }

  goToPage(page: number): void {
    this.page = page;
  }

  openResume(resume: Resume): void {
    this.viewingResumeId = resume.resumeId;

    this.resumeApi.incrementViewCount(resume.resumeId).subscribe({
      next: () => {
        const nextResumes = this.resumes.map((item) => (
          item.resumeId === resume.resumeId
            ? { ...item, viewCount: item.viewCount + 1 }
            : item
        ));

        this.resumes = nextResumes.sort((left, right) => right.viewCount - left.viewCount);
        this.selectedResume = this.resumes.find((item) => item.resumeId === resume.resumeId) ?? null;
        
        // Fetch details for preview
        if (this.selectedResume) {
          this.previewHtml = null; // Clear old preview to show loading
          this.fetchResumeDetails(this.selectedResume);
        }

        this.viewingResumeId = null;
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
      },
      error: () => {
        this.selectedResume = resume;
        this.previewHtml = null;
        this.fetchResumeDetails(this.selectedResume);
        this.viewingResumeId = null;
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
      }
    });
  }

  private fetchResumeDetails(resume: Resume): void {
    if (!resume.templateId) {
      console.warn('Resume has no templateId:', resume);
      return;
    }

    console.log('Fetching details for public resume:', resume.resumeId);

    forkJoin({
      sections: this.sectionApi.getSections(resume.resumeId).pipe(catchError(err => {
        console.error('Failed to fetch sections:', err);
        return of([] as ResumeSection[]);
      })),
      template: this.templateService.getTemplateById(resume.templateId).pipe(catchError(err => {
        console.error('Failed to fetch template:', err);
        return of(null);
      }))
    }).subscribe({
      next: ({ sections, template }) => {
        console.log('Fetched details:', { sectionCount: sections.length, hasTemplate: !!template });
        this.selectedResumeSections = sections;
        this.selectedFullTemplate = template;
        this.generatePreview();
      }
    });
  }

  private generatePreview(): void {
    if (!this.selectedResume || !this.selectedFullTemplate) {
      console.warn('Cannot generate preview: missing resume or template');
      return;
    }

    const data = this.prepareTemplateData(this.selectedResumeSections, this.selectedResume);
    const layout = this.selectedFullTemplate.htmlLayout || (this.selectedFullTemplate as any).html_layout || '';
    const styles = this.selectedFullTemplate.cssStyles || (this.selectedFullTemplate as any).css_styles || '';

    if (!layout) {
      console.warn('Template layout is empty');
      return;
    }

    try {
      console.log('Rendering template with data:', data);
      const rendered = Mustache.render(layout, data);
      const fullHtml = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; }
              ${styles}
            </style>
          </head>
          <body style="margin:0; padding:20px; background:white; min-height:100vh;">${rendered}</body>
        </html>
      `;
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(fullHtml);
      console.log('Preview HTML generated successfully');
    } catch (e) {
      console.error('Mustache rendering failed:', e);
      this.previewHtml = null;
    }
  }

  private prepareTemplateData(sections: ResumeSection[], resume: Resume): any {
    const data: any = {
      title: resume.title,
      targetJobTitle: resume.targetJobTitle,
      fullName: 'Public Profile',
      email: 'public@airesume.com',
      phone: '+1 (000) 000-0000',
      location: 'Remote',
      linkedin: 'linkedin.com/in/public',
      github: 'github.com/public',
      website: 'www.airesume.com'
    };

    sections.forEach(s => {
      try {
        const key = s.sectionType.toLowerCase();
        let parsed: any = null;
        try {
          parsed = JSON.parse(s.content);
        } catch {
          parsed = s.content;
        }
        
        data[key] = parsed;
        data[`${key}_title`] = s.title;

        // Legacy/Template specific mappings
        if (s.sectionType === 'SUMMARY') {
          data.summary = typeof parsed === 'object' ? parsed.text : parsed;
        } else if (s.sectionType === 'SKILLS') {
          let skills: any[] = [];
          if (Array.isArray(parsed)) {
            skills = parsed.map(sk => ({ name: sk }));
          } else if (parsed && typeof parsed === 'object') {
            skills = Object.values(parsed).flatMap((v: any) =>
              Array.isArray(v) ? v.map((sk: any) => ({ name: sk })) : []
            );
          }
          data.skills = skills;
          data.expertise = skills;
        } else if (s.sectionType === 'EXPERIENCE') {
          data.work = parsed;
        } else if (s.sectionType === 'PROJECTS') {
          data.portfolio = parsed;
        }
      } catch (e) {
        console.warn('Failed to prepare data for section:', s.sectionType, e);
      }
    });

    return data;
  }

  templateFor(templateId: number | null): TemplateResponseDTO | null {
    return templateId ? (this.templateMap.get(templateId) ?? null) : null;
  }

  goToTemplate(templateId: number | null | undefined): void {
    if (templateId) {
      this.router.navigate(['/templates', templateId]);
    } else {
      this.error = 'No template is linked to this resume.';
      setTimeout(() => { this.error = ''; }, 3000);
    }
  }
}

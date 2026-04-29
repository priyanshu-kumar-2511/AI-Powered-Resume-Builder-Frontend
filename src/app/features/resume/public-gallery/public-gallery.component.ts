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

@Component({
  selector: 'app-public-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, ResumeCardComponent],
  templateUrl: './public-gallery.component.html'
})
export class PublicGalleryComponent implements OnInit {
  private resumeApi = inject(ResumeApiService);
  private templateService = inject(TemplateService);
  private router = inject(Router);

  resumes: Resume[] = [];
  templateMap = new Map<number, TemplateResponseDTO>();
  selectedResume: Resume | null = null;

  loading = true;
  error = '';
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  viewingResumeId: number | null = null;

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
        this.viewingResumeId = null;
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
      },
      error: () => {
        this.selectedResume = resume;
        this.viewingResumeId = null;
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
      }
    });
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

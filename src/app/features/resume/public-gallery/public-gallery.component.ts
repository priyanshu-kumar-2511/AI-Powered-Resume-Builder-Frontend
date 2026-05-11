import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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

        this.viewingResumeId = null;
        this.resumes = nextResumes.sort((left, right) => right.viewCount - left.viewCount);
        this.router.navigate(['/resumes/public', resume.resumeId], {
          queryParams: { counted: 'true' }
        });
      },
      error: () => {
        this.viewingResumeId = null;
        this.router.navigate(['/resumes/public', resume.resumeId]);
      }
    });
  }

  templateFor(templateId: number | null): TemplateResponseDTO | null {
    return templateId ? (this.templateMap.get(templateId) ?? null) : null;
  }
}

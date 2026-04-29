import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import { Resume, TemplateResponseDTO, UserProfileResponse } from '../../../shared/models/models';
import { ResumeCardComponent } from '../card/resume-card.component';
import { ResumeApiService } from '../services/resume-api.service';
import { ResumeStateService } from '../services/resume-state.service';

@Component({
  selector: 'app-resume-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, ResumeCardComponent],
  templateUrl: './resume-dashboard.component.html'
})
export class ResumeDashboardComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private templateService = inject(TemplateService);
  private resumeApi = inject(ResumeApiService);
  private resumeState = inject(ResumeStateService);
  private destroy$ = new Subject<void>();

  profile: UserProfileResponse | null = this.auth.currentUser();
  resumes: Resume[] = [];
  templateMap = new Map<number, TemplateResponseDTO>();

  loading = true;
  error = '';
  actionMessage = '';
  busyResumeId: number | null = null;

  ngOnInit(): void {
    this.resumeState.resumes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((resumes) => {
        this.resumes = resumes;
      });

    this.templateService.getAllTemplates()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([] as TemplateResponseDTO[]))
      )
      .subscribe((templates) => {
        this.templateMap = new Map(templates.map((template) => [template.templateId, template]));
      });

    // Always refresh profile first so the currentUser signal is populated.
    // ResumeStateService.load() reads from that signal — if it's null and the
    // JWT claim is also absent the whole load throws before any HTTP call.
    this.auth.getProfile()
      .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe((profile) => {
        if (profile) { this.profile = profile; }

        this.resumeState.load()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => { this.loading = false; },
            error: (error: Error) => {
              this.error = error.message || 'We could not load your resumes right now.';
              this.loading = false;
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isFreePlan(): boolean {
    return (this.profile?.subscriptionPlan ?? this.auth.getCurrentPlan()) !== 'PREMIUM';
  }

  get freePlanLimitReached(): boolean {
    return this.isFreePlan && this.resumes.length >= 3;
  }

  get averageAtsScore(): number {
    if (!this.resumes.length) {
      return 0;
    }

    const total = this.resumes.reduce((sum, resume) => sum + (resume.atsScore || 0), 0);
    return Math.round(total / this.resumes.length);
  }

  get publishedCount(): number {
    return this.resumes.filter((resume) => resume.isPublic).length;
  }

  get completeCount(): number {
    return this.resumes.filter((resume) => resume.status === 'COMPLETE').length;
  }

  createNewResume(): void {
    if (this.freePlanLimitReached) {
      return;
    }

    this.router.navigate(['/resumes/new']);
  }

  editResume(resume: Resume): void {
    this.router.navigate(['/builder', resume.resumeId]);
  }

  duplicateResume(resume: Resume): void {
    if (this.freePlanLimitReached) {
      this.actionMessage = 'Free plan users can keep up to 3 resumes. Upgrade to duplicate more.';
      return;
    }

    this.runAction(
      resume.resumeId,
      this.resumeApi.duplicate(resume.resumeId),
      (createdResume) => {
        this.resumeState.add(createdResume);
        this.actionMessage = `"${resume.title}" duplicated successfully.`;
      }
    );
  }

  togglePublish(resume: Resume): void {
    const request$ = resume.isPublic
      ? this.resumeApi.unpublish(resume.resumeId)
      : this.resumeApi.publish(resume.resumeId);

    this.runAction(
      resume.resumeId,
      request$,
      (updatedResume) => {
        this.resumeState.update(updatedResume);
        this.actionMessage = resume.isPublic
          ? `"${resume.title}" has been removed from the public gallery.`
          : `"${resume.title}" is now visible in the public gallery.`;
      }
    );
  }

  deleteResume(resume: Resume): void {
    const confirmed = window.confirm(`Delete "${resume.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.busyResumeId = resume.resumeId;
    this.actionMessage = '';

    this.resumeApi.delete(resume.resumeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resumeState.remove(resume.resumeId);
          this.busyResumeId = null;
          this.actionMessage = `"${resume.title}" has been deleted.`;
        },
        error: () => {
          this.busyResumeId = null;
          this.actionMessage = 'Delete failed. Please try again.';
        }
      });
  }

  templateFor(templateId: number | null): TemplateResponseDTO | null {
    return templateId ? (this.templateMap.get(templateId) ?? null) : null;
  }

  private runAction(
    resumeId: number,
    request$: ReturnType<ResumeApiService['duplicate']>,
    onSuccess: (resume: Resume) => void
  ): void {
    this.busyResumeId = resumeId;
    this.actionMessage = '';

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resume) => {
          onSuccess(resume);
          this.busyResumeId = null;
        },
        error: () => {
          this.busyResumeId = null;
          this.actionMessage = 'Something went wrong. Please try again.';
        }
      });
  }
}

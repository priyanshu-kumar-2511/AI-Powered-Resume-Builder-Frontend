import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import {
  CreateResumeRequest,
  Resume,
  ResumeSection,
  Template,
  TemplateResponseDTO,
  UserProfileResponse,
} from '../../../shared/models/models';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { SectionApiService } from '../../builder/services/section-api.service';
import { ResumeApiService } from '../services/resume-api.service';

@Component({
  selector: 'app-public-resume-view',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />

    <div class="public-view page-enter">
      <div class="container">
        @if (loading) {
          <section class="viewer-loading">
            <div class="spinner"></div>
            <h2>Opening public resume...</h2>
            <p>We're loading the full resume and its template details.</p>
          </section>
        } @else if (error || !resume) {
          <section class="viewer-empty">
            <div class="empty-icon">⚠️</div>
            <h2>Could not open this resume</h2>
            <p>{{ error || 'The resume is unavailable right now.' }}</p>
            <div class="viewer-actions">
              <a routerLink="/resumes/public" class="btn btn-primary">Back to Gallery</a>
            </div>
          </section>
        } @else {
          <section class="viewer-hero">
            <div class="hero-copy">
              <a routerLink="/resumes/public" class="back-link">← Back to Gallery</a>
              <span class="badge badge-gold">Public Resume</span>
              <h1>{{ resume.title }}</h1>
              <p>{{ resume.targetJobTitle || 'Published resume preview' }}</p>

              <div class="hero-metrics">
                <div class="metric">
                  <span>Views</span>
                  <strong>{{ resume.viewCount }}</strong>
                </div>
                <div class="metric">
                  <span>ATS Score</span>
                  <strong>{{ resume.atsScore }}</strong>
                </div>
                <div class="metric">
                  <span>Template</span>
                  <strong>{{ templateSummary?.name || 'Custom' }}</strong>
                </div>
              </div>
            </div>
          </section>

          <section class="viewer-shell">
            <div class="resume-stage">
              @if (previewSrcdoc) {
                <iframe #previewFrame class="resume-frame" title="Public resume preview"></iframe>
              } @else {
                <div class="viewer-empty inline-empty">
                  <div class="empty-icon">🧾</div>
                  <h3>Preview unavailable</h3>
                  <p>We found the resume, but could not render its template preview.</p>
                </div>
              }
            </div>

            <aside class="viewer-sidebar">
              <div class="sidebar-card template-card">
                <span class="eyebrow">Use this layout</span>
                <h3>{{ templateSummary?.name || 'Resume Template' }}</h3>
                <p>
                  Open this design inside your builder and start with the same visual direction.
                </p>

                @if (templateSummary?.thumbnailUrl) {
                  <img class="template-thumb" [src]="templateSummary?.thumbnailUrl" [alt]="templateSummary?.name || 'Template preview'">
                }

                <div class="template-meta">
                  <span class="meta-pill" [class.premium]="templateSummary?.tier === 'PREMIUM'">
                    {{ templateSummary?.tier || 'FREE' }}
                  </span>
                  @if (templateSummary?.category) {
                    <span class="meta-pill neutral">{{ formatCategory(templateSummary!.category) }}</span>
                  }
                </div>

                <div class="sidebar-actions">
                  <button type="button" class="btn btn-primary btn-block" [disabled]="creating || !templateSummary" (click)="useTemplate()">
                    @if (creating) {
                      Creating...
                    } @else {
                      {{ ctaLabel }}
                    }
                  </button>

                  @if (templateSummary?.templateId) {
                    <a [routerLink]="['/templates', templateSummary?.templateId]" class="btn btn-ghost btn-block">View Template Details</a>
                  }
                </div>

                @if (actionError) {
                  <p class="action-error">{{ actionError }}</p>
                }
              </div>

              <div class="sidebar-card">
                <span class="eyebrow">About this resume</span>
                <ul class="facts">
                  <li><strong>Status:</strong> {{ resume.status }}</li>
                  <li><strong>Language:</strong> {{ resume.language || 'en' }}</li>
                  <li><strong>Updated:</strong> {{ resume.updatedAt | date:'mediumDate' }}</li>
                  <li><strong>Sections:</strong> {{ sections.length }}</li>
                </ul>
              </div>
            </aside>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .public-view {
      min-height: calc(100vh - 72px);
      padding: 36px 0 80px;
      background:
        radial-gradient(circle at top left, rgba(0, 212, 180, 0.08), transparent 28%),
        linear-gradient(180deg, #0b0e15 0%, #070a11 100%);
    }

    .viewer-loading,
    .viewer-empty {
      min-height: 56vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 14px;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 2.2rem;
      opacity: 0.9;
    }

    .viewer-hero {
      margin-bottom: 28px;
      padding: 30px 32px;
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.08);
      background:
        linear-gradient(135deg, rgba(0, 212, 180, 0.08), rgba(201, 168, 76, 0.08)),
        rgba(12, 18, 30, 0.88);
      box-shadow: 0 18px 60px rgba(0,0,0,0.22);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 14px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.92rem;
    }

    .back-link:hover { color: var(--text-primary); }

    .hero-copy h1 {
      font-size: clamp(2rem, 4vw, 3.4rem);
      margin: 10px 0 10px;
    }

    .hero-copy p {
      max-width: 720px;
      color: var(--text-secondary);
      margin-bottom: 22px;
    }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .metric {
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid rgba(0, 212, 180, 0.14);
      background: rgba(12, 25, 33, 0.7);
    }

    .metric span {
      display: block;
      font-size: 0.74rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .metric strong {
      font-size: 1.15rem;
      color: var(--text-primary);
    }

    .viewer-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 24px;
      align-items: start;
    }

    .resume-stage {
      min-height: 80vh;
      border-radius: 26px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      background: linear-gradient(180deg, #101624, #0c111d);
      box-shadow: 0 24px 70px rgba(0,0,0,0.25);
    }

    .resume-frame {
      width: 100%;
      min-height: 80vh;
      border: none;
      background: #fff;
      display: block;
    }

    .viewer-sidebar {
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: sticky;
      top: 92px;
    }

    .sidebar-card {
      padding: 22px;
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(13, 18, 30, 0.92);
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
    }

    .eyebrow {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(0, 212, 180, 0.1);
      color: var(--teal);
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .template-card h3 {
      font-size: 1.35rem;
      margin-bottom: 10px;
    }

    .template-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .template-thumb {
      width: 100%;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 14px;
      display: block;
      background: #fff;
    }

    .template-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .meta-pill {
      display: inline-flex;
      padding: 5px 10px;
      border-radius: 999px;
      background: rgba(0, 212, 180, 0.08);
      color: var(--teal);
      border: 1px solid rgba(0, 212, 180, 0.18);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .meta-pill.premium {
      background: rgba(201, 168, 76, 0.12);
      color: var(--gold);
      border-color: rgba(201, 168, 76, 0.2);
    }

    .meta-pill.neutral {
      background: rgba(255,255,255,0.05);
      color: var(--text-secondary);
      border-color: rgba(255,255,255,0.08);
    }

    .sidebar-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
      text-align: center;
    }

    .action-error {
      margin-top: 12px;
      color: #f87171;
      font-size: 0.86rem;
      line-height: 1.5;
    }

    .facts {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 10px;
      color: var(--text-secondary);
      font-size: 0.92rem;
    }

    .facts strong {
      color: var(--text-primary);
      margin-right: 6px;
    }

    .inline-empty {
      min-height: 80vh;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid rgba(0, 212, 180, 0.14);
      border-top-color: var(--teal);
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 1100px) {
      .viewer-shell {
        grid-template-columns: 1fr;
      }

      .viewer-sidebar {
        position: static;
      }
    }

    @media (max-width: 720px) {
      .public-view {
        padding-top: 22px;
      }

      .viewer-hero {
        padding: 22px 18px;
      }

      .hero-metrics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PublicResumeViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private resumeApi = inject(ResumeApiService);
  private sectionApi = inject(SectionApiService);
  private templateSvc = inject(TemplateService);
  private templateRenderer = inject(TemplateRenderService);

  resume: Resume | null = null;
  templateSummary: TemplateResponseDTO | null = null;
  template: Template | null = null;
  sections: ResumeSection[] = [];

  loading = true;
  creating = false;
  error = '';
  actionError = '';

  private previewIframe: HTMLIFrameElement | null = null;

  @ViewChild('previewFrame') set previewFrameRef(ref: ElementRef<HTMLIFrameElement> | undefined) {
    if (!ref?.nativeElement) {
      return;
    }
    this.previewIframe = ref.nativeElement;
    queueMicrotask(() => this.writePreviewFrame());
  }

  get previewSrcdoc(): string | null {
    if (!this.resume || !this.template) {
      return null;
    }

    return this.templateRenderer.renderDocument(this.template, {
      fitToPage: true,
      resume: this.resume,
      sections: this.sections,
      profile: this.publicProfile,
      useDemoData: false,
    });
  }

  get ctaLabel(): string {
    if (!this.auth.isLoggedIn()) {
      return 'Sign up to use this template';
    }
    if (this.templateSummary?.tier === 'PREMIUM' && this.auth.getCurrentPlan() !== 'PREMIUM') {
      return 'Upgrade to use this template';
    }
    return 'Use this template';
  }

  get publicProfile(): UserProfileResponse {
    return {
      username: 'public-profile',
      fullName: 'Public Candidate',
      email: 'public@resumeai.app',
      mobileNumber: '+1 (000) 000-0000',
      age: 0,
      subscriptionPlan: 'FREE',
      roles: ['ROLE_USER'],
      isActive: true,
      location: 'Remote',
      linkedin: 'linkedin.com/in/public-profile',
      github: 'github.com/public-profile',
      website: 'www.resumeai.app',
    };
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const resumeId = Number(params.get('resumeId'));
        if (!Number.isFinite(resumeId) || resumeId <= 0) {
          this.error = 'Invalid resume link.';
          this.loading = false;
          return of(null);
        }

        return forkJoin({
          resumes: this.resumeApi.getPublic().pipe(catchError(() => of([] as Resume[]))),
          templates: this.templateSvc.getAllTemplates().pipe(catchError(() => of([] as TemplateResponseDTO[]))),
        }).pipe(
          switchMap(({ resumes, templates }) => {
            const resume = resumes.find((item) => item.resumeId === resumeId) ?? null;
            if (!resume) {
              this.error = 'This public resume could not be found.';
              this.loading = false;
              return of(null);
            }

            this.resume = resume;
            this.templateSummary = resume.templateId
              ? templates.find((item) => item.templateId === resume.templateId) ?? null
              : null;

            const alreadyCounted = this.route.snapshot.queryParamMap.get('counted') === 'true';
            const viewCount$ = alreadyCounted
              ? of(null)
              : this.resumeApi.incrementViewCount(resume.resumeId).pipe(catchError(() => of(null)));

            const sections$ = this.sectionApi.getSections(resume.resumeId).pipe(
              catchError(() => of([] as ResumeSection[]))
            );

            const template$ = resume.templateId
              ? this.templateSvc.getTemplateById(resume.templateId).pipe(catchError(() => of(null)))
              : of(null);

            return forkJoin({ viewCount: viewCount$, sections: sections$, template: template$ });
          })
        );
      })
    ).subscribe({
      next: (result) => {
        if (!result || !this.resume) {
          return;
        }

        this.sections = result.sections;
        this.template = result.template;

        if (this.route.snapshot.queryParamMap.get('counted') !== 'true') {
          this.resume = { ...this.resume, viewCount: this.resume.viewCount + 1 };
        }

        this.loading = false;
        queueMicrotask(() => this.writePreviewFrame());
      },
      error: () => {
        this.error = 'Could not load the public resume.';
        this.loading = false;
      }
    });
  }

  useTemplate(): void {
    if (this.creating || !this.templateSummary) {
      return;
    }

    this.actionError = '';

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/register'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (this.templateSummary.tier === 'PREMIUM' && this.auth.getCurrentPlan() !== 'PREMIUM') {
      this.router.navigate(['/pricing'], {
        queryParams: { templateId: this.templateSummary.templateId }
      });
      return;
    }

    const userId = this.auth.getCurrentUserId();
    if (userId !== null) {
      this.createResumeFromTemplate(userId);
      return;
    }

    this.creating = true;
    this.auth.getProfile().pipe(catchError(() => of(null))).subscribe((profile) => {
      const resolvedId = profile?.userId ?? this.auth.getCurrentUserId();
      if (resolvedId === null) {
        this.creating = false;
        this.actionError = 'Could not verify your account. Please log in again and retry.';
        return;
      }
      this.createResumeFromTemplate(resolvedId);
    });
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private createResumeFromTemplate(userId: number): void {
    if (!this.templateSummary) {
      return;
    }

    this.creating = true;
    this.actionError = '';

    this.templateSvc.incrementUsage(this.templateSummary.templateId).subscribe({
      error: () => undefined
    });

    const payload: CreateResumeRequest = {
      userId,
      title: `${this.templateSummary.name} Resume`,
      templateId: this.templateSummary.templateId,
      targetJobTitle: this.resume?.targetJobTitle || '',
      language: this.resume?.language || 'en',
    };

    this.resumeApi.create(payload).subscribe({
      next: (createdResume) => {
        this.creating = false;
        this.router.navigate(['/builder', createdResume.resumeId]);
      },
      error: (err) => {
        this.creating = false;
        this.actionError = err?.status === 403
          ? 'Free plan resume limit reached. Upgrade to Premium to use more templates.'
          : 'Could not create a resume from this template right now.';
      }
    });
  }

  private writePreviewFrame(): void {
    const targetFrame = this.previewIframe;
    const html = this.previewSrcdoc;
    const doc = targetFrame?.contentDocument;

    if (!targetFrame || !doc || !html) {
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();
  }
}

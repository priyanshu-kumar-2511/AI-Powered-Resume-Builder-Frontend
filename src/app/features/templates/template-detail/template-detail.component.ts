import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CreateResumeRequest, Template } from '../../../shared/models/models';
import { TemplateRenderService } from '../../../shared/services/template-render.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';

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
  private resumeApi = inject(ResumeApiService);
  private templateRenderer = inject(TemplateRenderService);

  auth = inject(AuthService);

  template: Template | null = null;
  loading = true;
  error = '';
  creating = false;
  showPremiumModal = false;
  private previewIframe: HTMLIFrameElement | null = null;

  @ViewChild('previewFrame') set previewFrameRef(ref: ElementRef<HTMLIFrameElement> | undefined) {
    if (!ref?.nativeElement) {
      return;
    }

    this.previewIframe = ref.nativeElement;
    queueMicrotask(() => this.writePreviewFrame());
  }

  get previewSrcdoc(): string | null {
    return this.templateRenderer.renderDocument(this.template, { fitToPage: true });
  }

  get previewImageUrl(): string | null {
    return this.template?.thumbnailUrl || null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.templateSvc.getTemplateById(id).subscribe({
      next: (template) => {
        this.template = template;
        this.loading = false;
        queueMicrotask(() => this.writePreviewFrame());
      },
      error: () => {
        this.error = 'Template not found.';
        this.loading = false;
      }
    });
  }

  useTemplate(): void {
    if (this.creating) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/register']);
      return;
    }
    if (!this.template) return;

    if (this.template.tier === 'PREMIUM' && this.auth.getCurrentPlan() !== 'PREMIUM') {
      this.showPremiumModal = true;
      return;
    }

    const userId = this.auth.getCurrentUserId();
    if (userId !== null) {
      this.doCreate(userId);
      return;
    }

    this.creating = true;
    this.error = '';
    this.auth.getProfile()
      .pipe(catchError(() => of(null)))
      .subscribe((profile) => {
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

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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

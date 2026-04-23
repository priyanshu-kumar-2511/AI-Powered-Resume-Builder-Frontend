import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateService } from '../../../core/services/template.service';
import { CreateResumeRequest, TemplateResponseDTO } from '../../../shared/models/models';
import { ResumeApiService } from '../services/resume-api.service';
import { ResumeStateService } from '../services/resume-state.service';

type ResumeCreateForm = FormGroup<{
  targetJobTitle: FormControl<string>;
  language: FormControl<string>;
  title: FormControl<string>;
}>;

@Component({
  selector: 'app-create-resume',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NavbarComponent],
  templateUrl: './create-resume.component.html'
})
export class CreateResumeComponent implements OnInit {
  private auth = inject(AuthService);
  private templateService = inject(TemplateService);
  private resumeApi = inject(ResumeApiService);
  private resumeState = inject(ResumeStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: ResumeCreateForm = new FormGroup({
    targetJobTitle: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    language: new FormControl('en', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] })
  });

  readonly languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'hi', label: 'Hindi' }
  ];

  step = 1;
  freeTemplates: TemplateResponseDTO[] = [];
  premiumTemplates: TemplateResponseDTO[] = [];
  selectedTemplateId: number | null = null;
  loading = true;
  error = '';
  creating = false;

  ngOnInit(): void {
    const selectedFromQuery = Number(this.route.snapshot.queryParamMap.get('templateId'));
    if (Number.isFinite(selectedFromQuery) && selectedFromQuery > 0) {
      this.selectedTemplateId = selectedFromQuery;
    }

    forkJoin({
      free: this.templateService.getFreeTemplates().pipe(catchError(() => of([] as TemplateResponseDTO[]))),
      premium: this.auth.isLoggedIn()
        ? this.templateService.getPremiumTemplates().pipe(catchError(() => of([] as TemplateResponseDTO[])))
        : of([] as TemplateResponseDTO[])
    }).subscribe({
      next: ({ free, premium }) => {
        this.freeTemplates = free;
        this.premiumTemplates = premium;
        if (this.selectedTemplate && this.isTemplateLocked(this.selectedTemplate)) {
          this.selectedTemplateId = null;
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'We could not load templates for resume creation.';
        this.loading = false;
      }
    });
  }

  get selectedTemplate(): TemplateResponseDTO | null {
    return [...this.freeTemplates, ...this.premiumTemplates].find(
      (template) => template.templateId === this.selectedTemplateId
    ) ?? null;
  }

  get isFreePlan(): boolean {
    return this.auth.getCurrentPlan() !== 'PREMIUM';
  }

  nextStep(): void {
    if (this.step === 1) {
      if (!this.selectedTemplateId) {
        this.error = 'Please choose a template before continuing.';
        return;
      }

      if (this.selectedTemplate && this.isTemplateLocked(this.selectedTemplate)) {
        this.error = 'This template is available on the premium plan only.';
        return;
      }

      this.error = '';
    }

    if (this.step === 2 && (this.form.controls.targetJobTitle.invalid || this.form.controls.language.invalid)) {
      this.form.controls.targetJobTitle.markAsTouched();
      return;
    }

    if (this.step < 3) {
      this.error = '';
      this.step += 1;
    }
  }

  previousStep(): void {
    this.error = '';
    if (this.step > 1) {
      this.step -= 1;
    }
  }

  chooseTemplate(template: TemplateResponseDTO): void {
    if (this.isTemplateLocked(template)) {
      return;
    }

    this.selectedTemplateId = template.templateId;
    this.error = '';
  }

  createResume(): void {
    if (this.form.invalid || !this.selectedTemplateId) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.selectedTemplate && this.isTemplateLocked(this.selectedTemplate)) {
      this.error = 'This template is available on the premium plan only.';
      return;
    }

    const userId = this.auth.getCurrentUserId();
    if (userId === null) {
      this.error = 'We could not resolve your account identity for resume creation.';
      return;
    }

    const payload: CreateResumeRequest = {
      userId,
      title: this.form.controls.title.value.trim(),
      templateId: this.selectedTemplateId,
      targetJobTitle: this.form.controls.targetJobTitle.value.trim(),
      language: this.form.controls.language.value
    };

    this.creating = true;
    this.error = '';

    this.resumeApi.create(payload).subscribe({
      next: (resume) => {
        this.resumeState.add(resume);
        this.creating = false;

        if (this.selectedTemplateId) {
          this.templateService.incrementUsage(this.selectedTemplateId).subscribe({ error: () => undefined });
        }

        this.router.navigate(['/builder', resume.resumeId]);
      },
      error: () => {
        this.creating = false;
        this.error = 'Resume creation failed. Please try again.';
      }
    });
  }

  isTemplateLocked(template: TemplateResponseDTO): boolean {
    return template.tier === 'PREMIUM' && this.isFreePlan;
  }
}

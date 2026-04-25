import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SectionApiService } from '../services/section-api.service';
import { BuilderStateService } from '../services/builder-state.service';
import { AddSectionRequest, ResumeSection, SectionType } from '../../../shared/models/models';

interface SectionOption {
  type: SectionType;
  label: string;
  icon: string;
  defaultTitle: string;
}

@Component({
  selector: 'app-add-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-section.component.html'
})
export class AddSectionComponent {
  @Input({ required: true }) resumeId!: number;
  @Output() sectionAdded = new EventEmitter<ResumeSection>();
  @Output() cancelled    = new EventEmitter<void>();

  private sectionApi   = inject(SectionApiService);
  private builderState = inject(BuilderStateService);

  readonly sectionOptions: SectionOption[] = [
    { type: 'SUMMARY',        icon: '📝', label: 'Summary',        defaultTitle: 'Professional Summary' },
    { type: 'EXPERIENCE',     icon: '💼', label: 'Experience',     defaultTitle: 'Work Experience' },
    { type: 'EDUCATION',      icon: '🎓', label: 'Education',      defaultTitle: 'Education' },
    { type: 'SKILLS',         icon: '⚡', label: 'Skills',         defaultTitle: 'Skills' },
    { type: 'CERTIFICATIONS', icon: '🏆', label: 'Certifications', defaultTitle: 'Certifications' },
    { type: 'PROJECTS',       icon: '🛠️', label: 'Projects',       defaultTitle: 'Projects' },
    { type: 'LANGUAGES',      icon: '🌐', label: 'Languages',      defaultTitle: 'Languages' },
    { type: 'VOLUNTEER',      icon: '🤝', label: 'Volunteer',      defaultTitle: 'Volunteer Work' },
    { type: 'CUSTOM',         icon: '📄', label: 'Custom',         defaultTitle: 'Custom Section' }
  ];

  selectedType: SectionType | null = null;
  adding = false;
  error = '';

  form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)]
    })
  });

  selectType(option: SectionOption): void {
    this.selectedType = option.type;
    this.form.controls.title.setValue(option.defaultTitle);
    this.error = '';
  }

  add(): void {
    if (!this.selectedType || this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.selectedType) this.error = 'Please select a section type.';
      return;
    }

    const nextOrder = this.builderState.sectionsSnapshot.length;

    const payload: AddSectionRequest = {
      resumeId: this.resumeId,
      sectionType: this.selectedType,
      title: this.form.controls.title.value.trim(),
      content: this.defaultContent(this.selectedType),
      displayOrder: nextOrder
    };

    this.adding = true;
    this.error  = '';

    this.sectionApi.addSection(payload).subscribe({
      next: section => {
        this.builderState.addSection(section);
        this.adding = false;
        this.sectionAdded.emit(section);
      },
      error: () => {
        this.adding = false;
        this.error = 'Could not add section. Please try again.';
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private defaultContent(type: SectionType): string {
    switch (type) {
      case 'SUMMARY':    return JSON.stringify({ text: '' });
      case 'EXPERIENCE': return JSON.stringify([]);
      case 'EDUCATION':  return JSON.stringify([]);
      case 'SKILLS':     return JSON.stringify([]);
      default:           return JSON.stringify({ html: '' });
    }
  }
}

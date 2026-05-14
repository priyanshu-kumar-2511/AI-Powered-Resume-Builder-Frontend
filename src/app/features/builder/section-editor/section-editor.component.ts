import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { SectionApiService } from '../services/section-api.service';
import { BuilderStateService } from '../services/builder-state.service';
import { ResumeSection } from '../../../shared/models/models';
import { SummaryEditorComponent } from '../editors/summary-editor.component';
import { ExperienceEditorComponent } from '../editors/experience-editor.component';
import { EducationEditorComponent } from '../editors/education-editor.component';
import { SkillsEditorComponent } from '../editors/skills-editor.component';
import { GenericSectionEditorComponent } from '../editors/generic-section-editor.component';

@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [
    CommonModule,
    SummaryEditorComponent,
    ExperienceEditorComponent,
    EducationEditorComponent,
    SkillsEditorComponent,
    GenericSectionEditorComponent
  ],
  templateUrl: './section-editor.component.html'
})
export class SectionEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() sectionUpdated = new EventEmitter<ResumeSection>();
  @Output() sectionDeleted = new EventEmitter<number>();

  private sectionApi   = inject(SectionApiService);
  private builderState = inject(BuilderStateService);

  deleting = false;
  deleteError = '';
  showConfirmDelete = false;

  ngOnChanges(): void {
    this.deleteError = '';
    this.deleting = false;
    this.showConfirmDelete = false;
  }

  onUpdated(section: ResumeSection): void {
    this.builderState.updateSection(section);
    this.sectionUpdated.emit(section);
  }

  deleteSection(): void {
    if (!this.showConfirmDelete) {
      this.showConfirmDelete = true;
      return;
    }

    this.deleting = true;
    this.deleteError = '';

    this.sectionApi.deleteSection(this.section.sectionId).subscribe({
      next: () => {
        this.builderState.removeSection(this.section.sectionId);
        this.sectionDeleted.emit(this.section.sectionId);
      },
      error: () => {
        this.deleting = false;
        this.showConfirmDelete = false;
        this.deleteError = 'Could not delete section. Please try again.';
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
  }
}

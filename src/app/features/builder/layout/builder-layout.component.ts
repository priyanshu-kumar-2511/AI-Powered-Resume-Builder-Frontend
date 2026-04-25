import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { BuilderStateService } from '../services/builder-state.service';
import { SectionApiService } from '../services/section-api.service';
import { AutoSaveService } from '../services/auto-save.service';
import { LivePreviewService } from '../services/live-preview.service';
import { TemplateService } from '../../../core/services/template.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { SectionListComponent } from '../section-list/section-list.component';
import { SectionEditorComponent } from '../section-editor/section-editor.component';
import { AddSectionComponent } from '../add-section/add-section.component';
import { BuilderToolbarComponent } from '../toolbar/builder-toolbar.component';
import { LivePreviewComponent } from '../preview/live-preview.component';
import { ResumeSection } from '../../../shared/models/models';

@Component({
  selector: 'app-builder-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavbarComponent,
    SectionListComponent,
    SectionEditorComponent,
    AddSectionComponent,
    BuilderToolbarComponent,
    LivePreviewComponent
  ],
  templateUrl: './builder-layout.component.html'
})
export class BuilderLayoutComponent implements OnInit, OnDestroy {
  private route           = inject(ActivatedRoute);
  private sectionApi      = inject(SectionApiService);
  private resumeApi       = inject(ResumeApiService);
  private templateService = inject(TemplateService);
  private builderState    = inject(BuilderStateService);
  readonly autoSave       = inject(AutoSaveService);
  private livePreview     = inject(LivePreviewService);
  private destroy$        = new Subject<void>();

  readonly resumeId = Number(this.route.snapshot.paramMap.get('resumeId'));

  selectedSection: ResumeSection | null = null;
  showAddSection  = false;
  showSectionList = true;
  loading = true;
  error   = '';

  ngOnInit(): void {
    this.builderState.reset();
    this.loadResume();
    this.loadSections();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.builderState.reset();
  }

  private loadResume(): void {
    this.resumeApi.getById(this.resumeId)
      .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe(resume => {
        if (!resume) return;
        this.builderState.setResume(resume);
        if (resume.templateId) {
          this.templateService.getTemplateById(resume.templateId)
            .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
            .subscribe(template => this.builderState.setTemplate(template));
        }
      });
  }

  private loadSections(): void {
    this.loading = true;
    this.sectionApi.getSections(this.resumeId)
      .pipe(takeUntil(this.destroy$), catchError(() => of([])))
      .subscribe({
        next: sections => {
          this.builderState.setSections(sections);
          this.loading = false;
        },
        error: () => {
          this.error   = 'Could not load sections. Please refresh.';
          this.loading = false;
        }
      });
  }

  onSectionSelect(section: ResumeSection): void {
    this.selectedSection = section;
    this.showAddSection  = false;
  }

  onSectionAdded(section: ResumeSection): void {
    this.showAddSection  = false;
    this.selectedSection = section;
  }

  onSectionDeleted(sectionId: number): void {
    if (this.selectedSection?.sectionId === sectionId) {
      this.selectedSection = null;
    }
  }

  openAddSection(): void {
    this.showAddSection  = true;
    this.showSectionList = true;
    this.selectedSection = null;
  }

  closeAddSection(): void {
    this.showAddSection = false;
  }

  clearSection(): void {
    this.selectedSection = null;
  }

  onCanvasClick(): void {
    // intentional — future: deselect on backdrop click
  }

  /** Called when user clicks a section inside the live-preview iframe */
  onSectionClickFromPreview(sectionType: string): void {
    this.builderState.sections$.pipe(takeUntil(this.destroy$))
      .subscribe(sections => {
        const found = sections.find(s => s.sectionType === sectionType);
        if (found) {
          this.selectedSection = found;
          this.showAddSection  = false;
        }
      })
      .unsubscribe();
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { BuilderStateService } from '../services/builder-state.service';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection } from '../../../shared/models/models';

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-list.component.html'
})
export class SectionListComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resumeId!: number;
  @Input() selectedSectionId: number | null = null;
  @Output() sectionSelected = new EventEmitter<ResumeSection>();
  @Output() sectionDeleted  = new EventEmitter<number>();

  private builderState = inject(BuilderStateService);
  private sectionApi   = inject(SectionApiService);
  private destroy$     = new Subject<void>();

  sections: ResumeSection[] = [];
  togglingId: number | null = null;

  readonly typeIcons: Record<string, string> = {
    SUMMARY: '📝', EXPERIENCE: '💼', EDUCATION: '🎓', SKILLS: '⚡',
    CERTIFICATIONS: '🏆', PROJECTS: '🛠️', LANGUAGES: '🌐',
    VOLUNTEER: '🤝', CUSTOM: '📄'
  };

  ngOnInit(): void {
    this.builderState.sections$
      .pipe(takeUntil(this.destroy$))
      .subscribe((sections: ResumeSection[]) => this.sections = sections);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  iconFor(type: string): string {
    return this.typeIcons[type] ?? '📄';
  }

  select(section: ResumeSection): void {
    this.sectionSelected.emit(section);
  }

  toggleVisibility(event: Event, section: ResumeSection): void {
    event.stopPropagation();
    this.togglingId = section.sectionId;
    this.sectionApi.toggleVisibility(section.sectionId).subscribe({
      next: (updated: ResumeSection) => {
        this.builderState.updateSection(updated);
        this.togglingId = null;
      },
      error: () => { this.togglingId = null; }
    });
  }

  moveUp(event: Event, index: number): void {
    event.stopPropagation();
    if (index === 0) return;
    this.swapAndSave(index, index - 1);
  }

  moveDown(event: Event, index: number): void {
    event.stopPropagation();
    if (index === this.sections.length - 1) return;
    this.swapAndSave(index, index + 1);
  }

  private swapAndSave(from: number, to: number): void {
    const reordered = [...this.sections];
    const temp = reordered[from];
    reordered[from] = reordered[to];
    reordered[to] = temp;
    const updated = reordered.map((s: ResumeSection, i: number) => ({ ...s, displayOrder: i }));
    this.builderState.setSections(updated);
    this.sectionApi.reorder(this.resumeId, updated.map(s => s.sectionId)).subscribe();
  }
}

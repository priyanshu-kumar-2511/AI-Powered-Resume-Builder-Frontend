import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Resume, ResumeSection, Template } from '../../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  private sectionsSubject = new BehaviorSubject<ResumeSection[]>([]);
  private resumeSubject   = new BehaviorSubject<Resume | null>(null);
  private templateSubject = new BehaviorSubject<Template | null>(null);

  readonly sections$ = this.sectionsSubject.asObservable();
  readonly resume$   = this.resumeSubject.asObservable();
  readonly template$ = this.templateSubject.asObservable();

  get sectionsSnapshot(): ResumeSection[] { return this.sectionsSubject.value; }
  get resumeSnapshot(): Resume | null      { return this.resumeSubject.value; }
  get templateSnapshot(): Template | null  { return this.templateSubject.value; }

  // ── Sections ──────────────────────────────────────────────────────────────

  setSections(sections: ResumeSection[]): void {
    this.sectionsSubject.next(this.sortSections(sections));
  }

  addSection(section: ResumeSection): void {
    this.sectionsSubject.next(this.sortSections([...this.sectionsSnapshot, section]));
  }

  updateSection(updated: ResumeSection): void {
    const next = this.sectionsSnapshot.map(s =>
      s.sectionId === updated.sectionId ? updated : s
    );
    this.sectionsSubject.next(this.sortSections(next));
  }

  removeSection(sectionId: number): void {
    this.sectionsSubject.next(
      this.sectionsSnapshot.filter(s => s.sectionId !== sectionId)
    );
  }

  reorderSections(orderedIds: number[]): void {
    const map = new Map(this.sectionsSnapshot.map(s => [s.sectionId, s]));
    const reordered = orderedIds
      .map((id, index) => {
        const s = map.get(id);
        return s ? { ...s, displayOrder: index } : null;
      })
      .filter((s): s is ResumeSection => s !== null);
    this.sectionsSubject.next(reordered);
  }

  // ── Resume ────────────────────────────────────────────────────────────────

  setResume(resume: Resume | null): void {
    this.resumeSubject.next(resume);
  }

  // ── Template ──────────────────────────────────────────────────────────────

  setTemplate(template: Template | null): void {
    this.templateSubject.next(template);
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  reset(): void {
    this.sectionsSubject.next([]);
    this.resumeSubject.next(null);
    this.templateSubject.next(null);
  }

  private sortSections(sections: ResumeSection[]): ResumeSection[] {
    return [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

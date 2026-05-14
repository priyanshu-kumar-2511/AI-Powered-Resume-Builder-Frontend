import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Resume, ResumeSection, Template, UserProfileResponse } from '../../../shared/models/models';

/**
 * Central state management service for the Resume Builder.
 * Manages the reactive state of the resume, its sections, the selected template,
 * and the user's styling preferences (font size/family) using RxJS BehaviorSubjects.
 */
@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  private readonly defaultPreviewStyle = {
    fontSize: 11,
    fontFamily: 'Inter',
    primaryColor: '#00d4b4',
    contactFontSize: 24
  };

  private sectionsSubject = new BehaviorSubject<ResumeSection[]>([]);
  private resumeSubject   = new BehaviorSubject<Resume | null>(null);
  private templateSubject = new BehaviorSubject<Template | null>(null);
  private userProfileSubject = new BehaviorSubject<UserProfileResponse | null>(null);
  private fontSubject     = new BehaviorSubject<{ fontSize: number, fontFamily: string, primaryColor: string, contactFontSize: number }>(this.defaultPreviewStyle);
  private isOverA4HeightSubject = new BehaviorSubject<boolean>(false);

  readonly sections$ = this.sectionsSubject.asObservable();
  readonly resume$   = this.resumeSubject.asObservable();
  readonly template$ = this.templateSubject.asObservable();
  readonly userProfile$ = this.userProfileSubject.asObservable();
  readonly font$     = this.fontSubject.asObservable();
  readonly isOverA4Height$ = this.isOverA4HeightSubject.asObservable();

  get sectionsSnapshot(): ResumeSection[] { return this.sectionsSubject.value; }
  get resumeSnapshot(): Resume | null      { return this.resumeSubject.value; }
  get templateSnapshot(): Template | null  { return this.templateSubject.value; }
  get userProfileSnapshot(): UserProfileResponse | null { return this.userProfileSubject.value; }
  get fontSnapshot() { return this.fontSubject.value; }
  get isOverA4HeightSnapshot(): boolean { return this.isOverA4HeightSubject.value; }

  setOverA4Height(isOver: boolean): void {
    this.isOverA4HeightSubject.next(isOver);
  }

  // ── Sections ──────────────────────────────────────────────────────────────
  
  /**
   * Initializes or completely replaces the list of sections.
   * The list is automatically sorted by displayOrder before being pushed.
   * @param sections The new list of sections
   */
  setSections(sections: ResumeSection[]): void {
    this.sectionsSubject.next(this.sortSections(sections));
  }

  /**
   * Adds a new section to the existing list and re-sorts them.
   * @param section The new section to add
   */
  addSection(section: ResumeSection): void {
    this.sectionsSubject.next(this.sortSections([...this.sectionsSnapshot, section]));
  }

  /**
   * Updates an existing section in the state.
   * Replaces the old section with the updated one based on sectionId.
   * @param updated The updated section object
   */
  updateSection(updated: ResumeSection): void {
    const next = this.sectionsSnapshot.map(s =>
      s.sectionId === updated.sectionId ? updated : s
    );
    this.sectionsSubject.next(this.sortSections(next));
  }

  /**
   * Removes a section from the state by its ID.
   * @param sectionId The ID of the section to remove
   */
  removeSection(sectionId: number): void {
    this.sectionsSubject.next(
      this.sectionsSnapshot.filter(s => s.sectionId !== sectionId)
    );
  }

  /**
   * Reorders the current sections based on an array of section IDs.
   * Updates the displayOrder property of each section to match its index in the array.
   * @param orderedIds An array of section IDs in the new desired order
   */
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
    if (resume?.customizations) {
      try {
        const parsed = JSON.parse(resume.customizations);
        this.fontSubject.next({
          fontSize: parsed.fontSize ?? this.defaultPreviewStyle.fontSize,
          fontFamily: parsed.fontFamily ?? this.defaultPreviewStyle.fontFamily,
          primaryColor: parsed.primaryColor ?? this.defaultPreviewStyle.primaryColor,
          contactFontSize: parsed.contactFontSize ?? this.defaultPreviewStyle.contactFontSize
        });
      } catch (e) {
        console.error('Failed to parse customizations from resume:', e);
      }
    }
  }

  // ── User Profile ──────────────────────────────────────────────────────────
  
  /**
   * Sets the current user profile info (name, email, etc.) for template rendering.
   */
  setUserProfile(profile: UserProfileResponse | null): void {
    this.userProfileSubject.next(profile);
  }

  // ── Template ──────────────────────────────────────────────────────────────
  
  /**
   * Sets the currently active template being used for live preview.
   * @param template The template object or null
   */
  setTemplate(template: Template | null): void {
    this.templateSubject.next(template);
  }

  // ── Font Controls ─────────────────────────────────────────────────────────
  
  /**
   * Sets the global font size for the live preview.
   * @param size The font size in pixels (clamped between 6 and 32)
   */
  setFontSize(size: number): void {
    const clampedSize = Math.max(6, Math.min(size, 32));
    this.fontSubject.next({ ...this.fontSnapshot, fontSize: clampedSize });
  }

  increaseFontSize(): void {
    this.setFontSize(this.fontSnapshot.fontSize + 1);
  }

  decreaseFontSize(): void {
    this.setFontSize(Math.max(6, this.fontSnapshot.fontSize - 1));
  }

  setFontFamily(family: string): void {
    this.fontSubject.next({ ...this.fontSnapshot, fontFamily: family });
  }

  setPrimaryColor(color: string): void {
    if (!color) return;
    this.fontSubject.next({ ...this.fontSnapshot, primaryColor: color });
  }

  setContactFontSize(size: number): void {
    this.fontSubject.next({ ...this.fontSnapshot, contactFontSize: size });
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  
  /**
   * Completely clears the builder state (sections, resume, template).
   * Usually called when navigating away from the builder.
   */
  reset(): void {
    this.sectionsSubject.next([]);
    this.resumeSubject.next(null);
    this.templateSubject.next(null);
    this.fontSubject.next(this.defaultPreviewStyle);
  }

  private sortSections(sections: ResumeSection[]): ResumeSection[] {
    return [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

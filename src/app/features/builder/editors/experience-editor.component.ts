import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SectionApiService } from '../services/section-api.service';
import { ResumeSection } from '../../../shared/models/models';

interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

@Component({
  selector: 'app-experience-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './experience-editor.component.html'
})
export class ExperienceEditorComponent implements OnChanges {
  @Input({ required: true }) section!: ResumeSection;
  @Output() saved = new EventEmitter<ResumeSection>();

  private sectionApi = inject(SectionApiService);
  private destroy$   = new Subject<void>();

  form = new FormArray<FormGroup>([]);
  fontSizeControl = new FormControl(12, { nonNullable: true });
  saving = false;
  saveError = '';

  get entries(): FormGroup[] { return this.form.controls as FormGroup[]; }

  ngOnChanges(): void {
    this.destroy$.next();
    this.saveError = '';

    let data: any = null;
    try { data = JSON.parse(this.section.content || '[]'); } catch { data = []; }
    
    let items: ExperienceEntry[] = [];
    let fontSize = 12;

    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      items = data.items || [];
      fontSize = data.fontSize || 12;
    }

    this.fontSizeControl.setValue(fontSize, { emitEvent: false });
    this.form = new FormArray(items.map(e => this.buildEntry(e)));

    const update$ = new Subject<void>();
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());
    this.fontSizeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => update$.next());

    update$.pipe(
      debounceTime(800),
      switchMap(() => {
        this.saving = true; this.saveError = '';
        const payload = { items: this.form.value, fontSize: this.fontSizeControl.value };
        return this.sectionApi.updateSection(this.section.sectionId, {
          content: JSON.stringify(payload)
        }).pipe(
          catchError(() => { this.saving = false; this.saveError = 'Save failed.'; return EMPTY; })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      this.saving = false;
      this.saved.emit(updated);
    });
  }

  addEntry(): void {
    this.form.push(this.buildEntry({ company: '', role: '', startDate: '', endDate: '', isCurrent: false, bullets: [''] }));
  }

  removeEntry(index: number): void {
    this.form.removeAt(index);
  }

  getBullets(entryGroup: FormGroup): FormArray {
    return entryGroup.get('bullets') as FormArray;
  }

  addBullet(entryGroup: FormGroup): void {
    this.getBullets(entryGroup).push(new FormControl('', { nonNullable: true }));
  }

  removeBullet(entryGroup: FormGroup, bulletIndex: number): void {
    this.getBullets(entryGroup).removeAt(bulletIndex);
  }

  asFormGroup(ctrl: AbstractControl): FormGroup { return ctrl as FormGroup; }

  private buildEntry(e: ExperienceEntry): FormGroup {
    return new FormGroup({
      company:   new FormControl(e.company   || '', { nonNullable: true, validators: [Validators.required] }),
      role:      new FormControl(e.role      || '', { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl(e.startDate || '', { nonNullable: true }),
      endDate:   new FormControl(e.endDate   || '', { nonNullable: true }),
      isCurrent: new FormControl(e.isCurrent || false, { nonNullable: true }),
      bullets:   new FormArray((e.bullets || ['']).map(b => new FormControl(b, { nonNullable: true })))
    });
  }
}

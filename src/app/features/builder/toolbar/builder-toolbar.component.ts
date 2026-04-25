import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BuilderStateService } from '../services/builder-state.service';
import { AutoSaveService } from '../services/auto-save.service';
import { ResumeApiService } from '../../resume/services/resume-api.service';
import { Resume } from '../../../shared/models/models';

@Component({
  selector: 'app-builder-toolbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './builder-toolbar.component.html'
})
export class BuilderToolbarComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resumeId!: number;

  private builderState = inject(BuilderStateService);
  private resumeApi    = inject(ResumeApiService);
  readonly autoSave    = inject(AutoSaveService);
  private destroy$     = new Subject<void>();

  resume: Resume | null = null;

  ngOnInit(): void {
    this.builderState.resume$
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => this.resume = r);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get atsColor(): string {
    const score = this.resume?.atsScore ?? 0;
    if (score >= 80) return 'var(--teal)';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  get atsRing(): string {
    const deg = (this.resume?.atsScore ?? 0) * 3.6;
    return `conic-gradient(${this.atsColor} ${deg}deg, rgba(255,255,255,0.08) 0deg)`;
  }
}

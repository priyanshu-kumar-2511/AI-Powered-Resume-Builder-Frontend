import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Resume, TemplateResponseDTO } from '../../../shared/models/models';

@Component({
  selector: 'app-resume-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume-card.component.html'
})
export class ResumeCardComponent {
  @Input({ required: true }) resume!: Resume;
  @Input() template: TemplateResponseDTO | null = null;
  @Input() showPublicMeta = false;
  @Input() disableActions = false;

  @Output() edit = new EventEmitter<Resume>();
  @Output() duplicate = new EventEmitter<Resume>();
  @Output() publish = new EventEmitter<Resume>();
  @Output() unpublish = new EventEmitter<Resume>();
  @Output() delete = new EventEmitter<Resume>();
  @Output() open = new EventEmitter<Resume>();

  get atsScore(): number {
    return Math.max(0, Math.min(100, this.resume.atsScore ?? 0));
  }

  get atsRingStyle(): string {
    return `conic-gradient(var(--teal) ${this.atsScore * 3.6}deg, rgba(255,255,255,0.08) 0deg)`;
  }

  get lastUpdatedLabel(): string {
    const updatedAt = new Date(this.resume.updatedAt).getTime();
    const diffMs = Date.now() - updatedAt;

    if (!Number.isFinite(updatedAt) || diffMs < 0) {
      return 'Updated just now';
    }

    const minute = 60_000;
    const hour = minute * 60;
    const day = hour * 24;

    if (diffMs < hour) {
      const minutes = Math.max(1, Math.floor(diffMs / minute));
      return `Updated ${minutes}m ago`;
    }

    if (diffMs < day) {
      const hours = Math.floor(diffMs / hour);
      return `Updated ${hours}h ago`;
    }

    const days = Math.floor(diffMs / day);
    return `Updated ${days}d ago`;
  }

  get statusClass(): string {
    return this.resume.status === 'COMPLETE' ? 'status-complete' : 'status-draft';
  }

  handleOpen(): void {
    if (this.showPublicMeta) {
      this.open.emit(this.resume);
    }
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportApiService } from '../services/export-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExportJob } from '../../../shared/models/models';

@Component({
  selector: 'app-export-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eh-wrap">
      <div class="eh-head">
        <h3 class="eh-title">Export History</h3>
        <span class="eh-count">{{ jobs.length }} exports</span>
      </div>

      @if (loading) {
        <div class="eh-skeletons">
          @for (i of [1,2,3]; track i) {
            <div class="eh-skeleton"></div>
          }
        </div>
      }

      @if (!loading && jobs.length === 0) {
        <div class="eh-empty">
          <div class="eh-empty-icon">📂</div>
          <div class="eh-empty-title">No exports yet</div>
          <div class="eh-empty-desc">Your exported resume files will appear here</div>
        </div>
      }

      @if (!loading && jobs.length > 0) {
        <div class="eh-list">
          @for (job of jobs; track job.jobId) {
            <div class="eh-item">
              <div class="eh-item-left">
                <!-- Format badge -->
                <div class="eh-format-badge" [class]="'fmt-' + job.format.toLowerCase()">
                  {{ job.format }}
                </div>
                <div class="eh-item-info">
                  <div class="eh-item-name">
                    resume_{{ job.resumeId }}.{{ job.format.toLowerCase() }}
                  </div>
                  <div class="eh-item-meta">
                    {{ formatDate(job.requestedAt) }}
                    @if (job.fileSizeKb) { · {{ job.fileSizeKb }} KB }
                    @if (job.expiresAt && isExpired(job.expiresAt)) { · <span class="eh-expired">Expired</span> }
                  </div>
                </div>
              </div>

              <div class="eh-item-right">
                <!-- Status pill -->
                <span class="eh-status" [class]="'st-' + job.status.toLowerCase()">
                  @switch (job.status) {
                    @case ('COMPLETED')  { ✓ Done }
                    @case ('FAILED')     { ✕ Failed }
                    @case ('PROCESSING') { ⚙ Processing }
                    @case ('QUEUED')     { ⏳ Queued }
                  }
                </span>

                <!-- Download button -->
                @if (job.status === 'COMPLETED' && !isExpired(job.expiresAt)) {
                  <button class="eh-download-btn" (click)="download(job)" [disabled]="downloading === job.jobId">
                    @if (downloading === job.jobId) {
                      <div class="eh-spinner"></div>
                    } @else {
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    }
                  </button>
                }

                <!-- Delete button -->
                <button class="eh-delete-btn"
                        (click)="deleteJob(job)"
                        [disabled]="deleting === job.jobId"
                        title="Delete">
                  @if (deleting === job.jobId) {
                    <div class="eh-spinner"></div>
                  } @else {
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  }
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .eh-wrap { padding: 4px 0; }

    .eh-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .eh-title { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.85); margin: 0; }
    .eh-count { font-size: 0.72rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); padding: 3px 9px; border-radius: 99px; }

    .eh-skeletons { display: flex; flex-direction: column; gap: 8px; }
    .eh-skeleton { height: 56px; border-radius: 10px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .eh-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; text-align: center; }
    .eh-empty-icon { font-size: 2rem; }
    .eh-empty-title { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.5); }
    .eh-empty-desc { font-size: 0.75rem; color: rgba(255,255,255,0.25); }

    .eh-list { display: flex; flex-direction: column; gap: 6px; }

    .eh-item {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px 14px; border-radius: 10px;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
      transition: background 0.2s;
    }
    .eh-item:hover { background: rgba(255,255,255,0.04); }

    .eh-item-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .eh-item-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

    .eh-format-badge {
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em;
      padding: 3px 7px; border-radius: 5px; flex-shrink: 0;
    }
    .fmt-pdf  { background: rgba(239,68,68,0.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.2);  }
    .fmt-docx { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.2); }
    .fmt-json { background: rgba(234,179,8,0.12);  color: #fde68a; border: 1px solid rgba(234,179,8,0.2);  }

    .eh-item-name { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.7); }
    .eh-item-meta { font-size: 0.68rem; color: rgba(255,255,255,0.3); margin-top: 2px; }
    .eh-expired { color: #f87171; }

    .eh-status { font-size: 0.65rem; font-weight: 700; padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
    .st-completed  { background: rgba(0,212,180,0.1);  color: #00d4b4; }
    .st-failed     { background: rgba(239,68,68,0.1);  color: #f87171; }
    .st-processing { background: rgba(59,130,246,0.1); color: #93c5fd; }
    .st-queued     { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }

    .eh-download-btn, .eh-delete-btn {
      width: 28px; height: 28px; border-radius: 6px;
      display: grid; place-items: center;
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer; transition: all 0.15s;
    }
    .eh-download-btn { background: rgba(0,212,180,0.08); color: #00d4b4; }
    .eh-download-btn:hover:not(:disabled) { background: rgba(0,212,180,0.15); }
    .eh-delete-btn   { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.3); }
    .eh-delete-btn:hover:not(:disabled)   { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #f87171; }
    .eh-download-btn:disabled, .eh-delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .eh-spinner { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); border-top-color: currentColor; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ExportHistoryComponent implements OnInit {
  private exportApi = inject(ExportApiService);
  private auth      = inject(AuthService);

  jobs:       ExportJob[] = [];
  loading     = true;
  downloading: string | null = null;
  deleting:    string | null = null;

  ngOnInit(): void {
    const uid = this.auth.getCurrentUserId();
    if (!uid) { this.loading = false; return; }

    this.exportApi.getByUser(uid).subscribe({
      next:  (jobs) => { this.jobs = jobs.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()); this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  download(job: ExportJob): void {
    this.downloading = job.jobId;
    this.exportApi.downloadFile(job.jobId, job.format, job.resumeId).subscribe({
      next: () => {
        this.downloading = null;
      },
      error: () => {
        this.downloading = null;
      }
    });
  }

  deleteJob(job: ExportJob): void {
    this.deleting = job.jobId;
    this.exportApi.deleteExport(job.jobId).subscribe({
      next:  () => { this.jobs = this.jobs.filter(j => j.jobId !== job.jobId); this.deleting = null; },
      error: () => { this.deleting = null; }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }
}

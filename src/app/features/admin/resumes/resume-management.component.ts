import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminUser } from '../services/admin-api.service';
import { forkJoin } from 'rxjs';

export interface AdminResume {
  resumeId: number;
  title: string;
  targetJobTitle: string;
  ownerEmail: string;
  ownerName: string;
  templateName: string;
  atsScore: number;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-resume-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">Resume Management</h1>
          <p class="page-sub">{{ filtered.length }} of {{ resumes.length }} resumes</p>
        </div>
        <input class="search-input" placeholder="Search by title, owner, template…"
               [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()">
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        @for (f of filters; track f.key) {
          <button class="filter-btn" [class.active]="activeFilter === f.key" (click)="setFilter(f.key)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading) {
        <div class="table-skeletons">
          @for (i of [1,2,3,4,5,6]; track i) { <div class="row-skeleton"></div> }
        </div>
      }

      @if (!loading) {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th><th>Owner</th><th>Template</th>
                <th>ATS Score</th><th>Status</th><th>Visibility</th>
                <th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (r of paginated; track r.resumeId) {
                <tr>
                  <td>
                    <div class="resume-title-cell">
                      <div class="resume-title">{{ r.title || 'Untitled' }}</div>
                      <div class="resume-job">{{ r.targetJobTitle }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="owner-cell">
                      <div class="owner-av">{{ (r.ownerName || 'U').charAt(0) }}</div>
                      <div>
                        <div class="owner-name">{{ r.ownerName }}</div>
                        <div class="owner-email">{{ r.ownerEmail }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="td-muted">{{ r.templateName || '—' }}</td>
                  <td>
                    <div class="ats-cell">
                      <div class="ats-bar">
                        <div class="ats-fill" [style.width.%]="r.atsScore"
                             [class.ats-high]="r.atsScore >= 70"
                             [class.ats-mid]="r.atsScore >= 40 && r.atsScore < 70"
                             [class.ats-low]="r.atsScore < 40"></div>
                      </div>
                      <span class="ats-val">{{ r.atsScore }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill" [class.s-complete]="r.status === 'COMPLETE'" [class.s-draft]="r.status === 'DRAFT'">
                      {{ r.status }}
                    </span>
                  </td>
                  <td>
                    <span class="vis-pill" [class.vis-public]="r.isPublic" [class.vis-private]="!r.isPublic">
                      {{ r.isPublic ? '🌍 Public' : '🔒 Private' }}
                    </span>
                  </td>
                  <td class="td-muted">{{ formatDate(r.createdAt) }}</td>
                  <td>
                    <button class="del-btn" (click)="confirmDelete(r)" [disabled]="busy === r.resumeId" title="Force delete">
                      🗑
                    </button>
                  </td>
                </tr>
              }
              @if (filtered.length === 0) {
                <tr><td colspan="8" class="empty-row">No resumes match your filter.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button [disabled]="currentPage === 0" (click)="goPage(currentPage - 1)">← Prev</button>
            <span>Page {{ currentPage + 1 }} / {{ totalPages }}</span>
            <button [disabled]="currentPage >= totalPages - 1" (click)="goPage(currentPage + 1)">Next →</button>
          </div>
        }
      }

      <!-- Delete confirm modal -->
      @if (deleteTarget) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="confirm-modal" (click)="$event.stopPropagation()">
            <div class="confirm-icon">⚠️</div>
            <h3 class="confirm-title">Force Delete Resume?</h3>
            <p class="confirm-desc">
              This will permanently delete <strong>"{{ deleteTarget.title || 'Untitled' }}"</strong>
              owned by <strong>{{ deleteTarget.ownerEmail }}</strong> and all its sections.
              This cannot be undone.
            </p>
            <div class="confirm-btns">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-delete" (click)="doDelete()">Delete permanently</button>
            </div>
          </div>
        </div>
      }

      @if (toast) {
        <div class="toast" [class.toast-err]="toastErr">{{ toast }}</div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px 36px; max-width: 1300px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: rgba(255,255,255,0.9); margin: 0 0 4px; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin: 0; }
    .search-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.8); padding: 8px 14px; font-size: 0.82rem; min-width: 260px; outline: none; font-family: inherit; }
    .search-input:focus { border-color: rgba(0,212,180,0.4); }

    .filter-bar { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; }
    .filter-btn { padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4); font-size: 0.75rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .filter-btn.active { background: rgba(0,212,180,0.1); border-color: rgba(0,212,180,0.3); color: #00d4b4; }

    .table-skeletons { display: flex; flex-direction: column; gap: 8px; }
    .row-skeleton { height: 52px; border-radius: 8px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .table-wrap { border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table thead { background: rgba(255,255,255,0.03); }
    .admin-table th { padding: 11px 14px; text-align: left; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.35); border-bottom: 1px solid rgba(255,255,255,0.07); }
    .admin-table td { padding: 12px 14px; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
    .td-muted { color: rgba(255,255,255,0.35); font-size: 0.75rem; }
    .empty-row { text-align: center; color: rgba(255,255,255,0.25); padding: 40px !important; }

    .resume-title-cell .resume-title { font-weight: 600; color: rgba(255,255,255,0.85); font-size: 0.82rem; }
    .resume-title-cell .resume-job { font-size: 0.68rem; color: rgba(255,255,255,0.3); margin-top: 2px; }

    .owner-cell { display: flex; align-items: center; gap: 8px; }
    .owner-av { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#4f46e5); display: grid; place-items: center; font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0; }
    .owner-name { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.75); }
    .owner-email { font-size: 0.66rem; color: rgba(255,255,255,0.3); }

    .ats-cell { display: flex; align-items: center; gap: 8px; }
    .ats-bar { width: 60px; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
    .ats-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
    .ats-high { background: #22c55e; }
    .ats-mid  { background: #f59e0b; }
    .ats-low  { background: #ef4444; }
    .ats-val  { font-size: 0.72rem; color: rgba(255,255,255,0.5); width: 24px; }

    .status-pill { font-size: 0.62rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .s-complete { background: rgba(0,212,180,0.1); color: #00d4b4; }
    .s-draft    { background: rgba(148,163,184,0.1); color: rgba(255,255,255,0.4); }
    .vis-pill   { font-size: 0.68rem; font-weight: 600; }
    .vis-public { color: #00d4b4; }
    .vis-private{ color: rgba(255,255,255,0.3); }

    .del-btn { width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.06); cursor: pointer; font-size: 0.85rem; color: #f87171; transition: all 0.15s; }
    .del-btn:hover:not(:disabled) { background: rgba(239,68,68,0.15); }
    .del-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; }
    .pagination button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 7px 16px; border-radius: 8px; font-size: 0.78rem; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
    .pagination button:disabled { opacity: 0.35; cursor: not-allowed; }
    .pagination span { font-size: 0.78rem; color: rgba(255,255,255,0.35); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .confirm-modal { background: #111520; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px; width: 100%; max-width: 420px; text-align: center; animation: slideUp 0.2s ease; }
    @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    .confirm-icon { font-size: 2rem; margin-bottom: 10px; }
    .confirm-title { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0 0 8px; }
    .confirm-desc { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0 0 20px; line-height: 1.5; }
    .confirm-btns { display: flex; gap: 8px; }
    .btn-cancel { flex: 1; padding: 9px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; font-size: 0.82rem; }
    .btn-cancel:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
    .btn-delete { flex: 1; padding: 9px; border-radius: 8px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #f87171; cursor: pointer; font-family: inherit; font-size: 0.82rem; font-weight: 600; }
    .btn-delete:hover { background: rgba(239,68,68,0.22); }

    .toast { position: fixed; bottom: 24px; right: 24px; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; padding: 10px 18px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; z-index: 2000; animation: slideUp 0.2s ease; }
    .toast.toast-err { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #f87171; }
  `]
})
export class ResumeManagementComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  resumes:     AdminResume[] = [];
  filtered:    AdminResume[] = [];
  loading      = true;
  busy:        number | null = null;
  searchQuery  = '';
  activeFilter = 'ALL';
  deleteTarget: AdminResume | null = null;
  toast        = '';
  toastErr     = false;

  // Pagination
  currentPage  = 0;
  pageSize     = 15;
  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get paginated(): AdminResume[] {
    const start = this.currentPage * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  readonly filters = [
    { key: 'ALL',      label: 'All Resumes' },
    { key: 'PUBLIC',   label: '🌍 Public' },
    { key: 'PRIVATE',  label: '🔒 Private' },
    { key: 'COMPLETE', label: 'Complete' },
    { key: 'DRAFT',    label: 'Draft' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({
      resumes: this.adminApi.getAllResumes(),
      users: this.adminApi.getAllUsers()
    }).subscribe({
      next: ({ resumes, users }) => {
        // Build a map from userId -> user
        const userMap = new Map<number, AdminUser>();
        users.forEach((u: AdminUser) => userMap.set(u.userId, u));

        // Enrich each resume with ownerName and ownerEmail
        this.resumes = resumes.map((r: any) => {
          const user = userMap.get(r.userId);
          return {
            ...r,
            ownerName:  user?.fullName  || user?.username || `User #${r.userId}`,
            ownerEmail: user?.username  || `user-${r.userId}`
          };
        });
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    let list = [...this.resumes];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.ownerEmail || '').toLowerCase().includes(q) ||
        (r.ownerName || '').toLowerCase().includes(q) ||
        (r.templateName || '').toLowerCase().includes(q)
      );
    }
    switch (this.activeFilter) {
      case 'PUBLIC':   list = list.filter(r => r.isPublic); break;
      case 'PRIVATE':  list = list.filter(r => !r.isPublic); break;
      case 'COMPLETE': list = list.filter(r => r.status === 'COMPLETE'); break;
      case 'DRAFT':    list = list.filter(r => r.status === 'DRAFT'); break;
    }
    this.filtered    = list;
    this.currentPage = 0;
  }

  setFilter(key: string): void { this.activeFilter = key; this.applyFilter(); }
  goPage(p: number): void { this.currentPage = p; }

  confirmDelete(r: AdminResume): void { this.deleteTarget = r; }
  closeModal(): void { this.deleteTarget = null; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    const r = this.deleteTarget;
    this.closeModal();
    this.busy = r.resumeId;
    this.adminApi.deleteResume(r.resumeId).subscribe({
      next: () => {
        this.resumes  = this.resumes.filter(x => x.resumeId !== r.resumeId);
        this.applyFilter();
        this.busy = null;
        this.showToast(`Resume "${r.title || 'Untitled'}" deleted`);
      },
      error: () => { this.busy = null; this.showToast('Delete failed', true); }
    });
  }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  }

  private showToast(msg: string, err = false): void {
    this.toast = msg; this.toastErr = err;
    setTimeout(() => this.toast = '', 3500);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../services/admin-api.service';

export interface AuditLog {
  logId: number;
  actorId: number;
  actorEmail: string;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  beforeState: string | null;
  afterState: string | null;
  ipAddress: string;
  timestamp: string;
}

type ActionCategory = 'ALL' | 'USER' | 'TEMPLATE' | 'RESUME' | 'SUBSCRIPTION' | 'AUTH';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Logs</h1>
          <p class="page-sub">Timestamped record of all significant platform actions</p>
        </div>
        <button class="refresh-btn" (click)="load()">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M4 4v5h5M20 20v-5h-5M15.24 15.24A8 8 0 1 0 8.76 8.76"/>
          </svg>
          Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <input class="search-input" placeholder="Search by actor, action, entity…"
               [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()">

        <div class="filter-tabs">
          @for (f of categories; track f.key) {
            <button class="cat-btn" [class.active]="activeCategory === f.key"
                    (click)="setCategory(f.key)">
              {{ f.icon }} {{ f.label }}
            </button>
          }
        </div>

        <div class="date-filters">
          <input type="date" class="date-input" [(ngModel)]="dateFrom"
                 (ngModelChange)="applyFilter()" title="From date">
          <span class="date-sep">→</span>
          <input type="date" class="date-input" [(ngModel)]="dateTo"
                 (ngModelChange)="applyFilter()" title="To date">
        </div>
      </div>

      <!-- Table -->
      @if (loading) {
        <div class="skeletons">
          @for (i of [1,2,3,4,5,6,7]; track i) { <div class="row-skeleton"></div> }
        </div>
      }

      @if (!loading) {
        <div class="table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP Address</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              @for (log of paginated; track log.logId) {
                <tr [class.expanded]="expanded === log.logId">
                  <!-- Timestamp -->
                  <td class="ts-cell">
                    <div class="ts-date">{{ formatDate(log.timestamp) }}</div>
                    <div class="ts-time">{{ formatTime(log.timestamp) }}</div>
                  </td>

                  <!-- Actor -->
                  <td>
                    <div class="actor-cell">
                      <div class="actor-av">{{ (log.actorName || 'S').charAt(0) }}</div>
                      <div>
                        <div class="actor-name">{{ log.actorName || 'System' }}</div>
                        <div class="actor-email">{{ log.actorEmail }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Action -->
                  <td>
                    <span class="action-badge" [attr.data-action]="actionCategory(log.actionType)">
                      {{ log.actionType }}
                    </span>
                  </td>

                  <!-- Entity -->
                  <td>
                    <div class="entity-cell">
                      <span class="entity-type">{{ log.entityType }}</span>
                      <span class="entity-id">#{{ log.entityId }}</span>
                    </div>
                  </td>

                  <!-- IP -->
                  <td class="ip-cell">{{ log.ipAddress || '—' }}</td>

                  <!-- Diff toggle -->
                  <td>
                    @if (log.beforeState || log.afterState) {
                      <button class="diff-btn" (click)="toggleExpand(log.logId)"
                              [class.open]="expanded === log.logId">
                        {{ expanded === log.logId ? '▲ Hide' : '▼ View' }}
                      </button>
                    } @else {
                      <span class="no-diff">—</span>
                    }
                  </td>
                </tr>

                <!-- Expandable diff row -->
                @if (expanded === log.logId && (log.beforeState || log.afterState)) {
                  <tr class="diff-row">
                    <td colspan="6">
                      <div class="diff-wrap">
                        @if (log.beforeState) {
                          <div class="diff-panel diff-before">
                            <div class="diff-panel-title">Before</div>
                            <pre class="diff-pre">{{ formatJson(log.beforeState) }}</pre>
                          </div>
                        }
                        @if (log.afterState) {
                          <div class="diff-panel diff-after">
                            <div class="diff-panel-title">After</div>
                            <pre class="diff-pre">{{ formatJson(log.afterState) }}</pre>
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }

              @if (filtered.length === 0) {
                <tr><td colspan="6" class="empty-row">No audit logs match your criteria.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button [disabled]="currentPage === 0" (click)="goPage(currentPage - 1)">← Prev</button>
            <span>Page {{ currentPage + 1 }} / {{ totalPages }} &nbsp;·&nbsp; {{ filtered.length }} records</span>
            <button [disabled]="currentPage >= totalPages - 1" (click)="goPage(currentPage + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px 36px; max-width: 1300px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: rgba(255,255,255,0.9); margin: 0 0 4px; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin: 0; }
    .refresh-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

    .filter-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .search-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.8); padding: 8px 14px; font-size: 0.82rem; min-width: 220px; outline: none; font-family: inherit; flex-shrink: 0; }
    .search-input:focus { border-color: rgba(0,212,180,0.4); }

    .filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .cat-btn { padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4); font-size: 0.72rem; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; }
    .cat-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
    .cat-btn.active { background: rgba(0,212,180,0.1); border-color: rgba(0,212,180,0.3); color: #00d4b4; }

    .date-filters { display: flex; align-items: center; gap: 6px; margin-left: auto; }
    .date-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.7); padding: 6px 10px; font-size: 0.76rem; font-family: inherit; outline: none; cursor: pointer; }
    .date-input:focus { border-color: rgba(0,212,180,0.4); }
    .date-sep { color: rgba(255,255,255,0.25); font-size: 0.8rem; }

    .skeletons { display: flex; flex-direction: column; gap: 6px; }
    .row-skeleton { height: 50px; border-radius: 8px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .table-wrap { border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
    .audit-table { width: 100%; border-collapse: collapse; }
    .audit-table thead { background: rgba(255,255,255,0.03); }
    .audit-table th { padding: 10px 14px; text-align: left; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.07); white-space: nowrap; }
    .audit-table td { padding: 11px 14px; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .audit-table tr:last-child td { border-bottom: none; }
    .audit-table tr.expanded td { background: rgba(0,212,180,0.03); }
    .audit-table tr:hover:not(.diff-row) td { background: rgba(255,255,255,0.02); }
    .empty-row { text-align: center; color: rgba(255,255,255,0.2); padding: 40px !important; }

    .ts-cell .ts-date { font-size: 0.75rem; color: rgba(255,255,255,0.6); font-weight: 600; white-space: nowrap; }
    .ts-cell .ts-time { font-size: 0.65rem; color: rgba(255,255,255,0.3); white-space: nowrap; }

    .actor-cell { display: flex; align-items: center; gap: 8px; }
    .actor-av { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#f59e0b,#d97706); display: grid; place-items: center; font-size: 0.72rem; font-weight: 700; color: #000; flex-shrink: 0; }
    .actor-name { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.78); }
    .actor-email { font-size: 0.64rem; color: rgba(255,255,255,0.3); }

    .action-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 0.65rem;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
    }
    .action-badge[data-action="USER"]         { background: rgba(59,130,246,0.12); color: #93c5fd; }
    .action-badge[data-action="TEMPLATE"]     { background: rgba(0,212,180,0.10); color: #00d4b4; }
    .action-badge[data-action="RESUME"]       { background: rgba(139,92,246,0.12); color: #c4b5fd; }
    .action-badge[data-action="SUBSCRIPTION"] { background: rgba(245,158,11,0.12); color: #fde68a; }
    .action-badge[data-action="AUTH"]         { background: rgba(34,197,94,0.10); color: #86efac; }
    .action-badge[data-action="OTHER"]        { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }

    .entity-cell { display: flex; flex-direction: column; gap: 2px; }
    .entity-type { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.04em; }
    .entity-id   { font-size: 0.65rem; color: rgba(255,255,255,0.3); }
    .ip-cell     { font-size: 0.72rem; color: rgba(255,255,255,0.3); font-family: 'Fira Code', monospace; }

    .diff-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 0.68rem; cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
    .diff-btn:hover { background: rgba(0,212,180,0.08); border-color: rgba(0,212,180,0.25); color: #00d4b4; }
    .diff-btn.open  { background: rgba(0,212,180,0.08); border-color: rgba(0,212,180,0.3); color: #00d4b4; }
    .no-diff { color: rgba(255,255,255,0.15); font-size: 0.7rem; }

    .diff-row td { padding: 0 !important; background: rgba(0,0,0,0.3) !important; }
    .diff-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.05); }
    .diff-panel { padding: 14px 16px; background: rgba(0,0,0,0.4); }
    .diff-before { border-left: 3px solid #ef4444; }
    .diff-after  { border-left: 3px solid #22c55e; }
    .diff-panel-title { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .diff-before .diff-panel-title { color: #f87171; }
    .diff-after  .diff-panel-title { color: #86efac; }
    .diff-pre { font-family: 'Fira Code', 'Courier New', monospace; font-size: 0.72rem; color: rgba(255,255,255,0.6); white-space: pre-wrap; word-break: break-all; margin: 0; line-height: 1.5; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; }
    .pagination button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 7px 16px; border-radius: 8px; font-size: 0.78rem; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
    .pagination button:disabled { opacity: 0.35; cursor: not-allowed; }
    .pagination span { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

    @media (max-width: 900px) {
      .date-filters { margin-left: 0; width: 100%; }
      .diff-wrap { grid-template-columns: 1fr; }
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  logs:        AuditLog[] = [];
  filtered:    AuditLog[] = [];
  loading      = true;
  searchQuery  = '';
  activeCategory: ActionCategory = 'ALL';
  dateFrom     = '';
  dateTo       = '';
  expanded:    number | null = null;

  currentPage = 0;
  pageSize    = 20;
  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get paginated(): AuditLog[] {
    const start = this.currentPage * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  readonly categories: { key: ActionCategory; icon: string; label: string }[] = [
    { key: 'ALL',          icon: '📋', label: 'All'          },
    { key: 'USER',         icon: '👥', label: 'User'         },
    { key: 'TEMPLATE',     icon: '🎨', label: 'Template'     },
    { key: 'RESUME',       icon: '📄', label: 'Resume'       },
    { key: 'SUBSCRIPTION', icon: '💳', label: 'Subscription' },
    { key: 'AUTH',         icon: '🔐', label: 'Auth'         },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminApi.getAuditLogs().subscribe({
      next:  l  => { this.logs = l; this.applyFilter(); this.loading = false; },
      error: () => { this.logs = []; this.filtered = []; this.loading = false; }
    });
  }

  applyFilter(): void {
    let list = [...this.logs];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(l =>
        (l.actorName  || '').toLowerCase().includes(q) ||
        (l.actorEmail || '').toLowerCase().includes(q) ||
        (l.actionType || '').toLowerCase().includes(q) ||
        (l.entityType || '').toLowerCase().includes(q) ||
        (l.entityId   || '').toLowerCase().includes(q)
      );
    }

    if (this.activeCategory !== 'ALL') {
      list = list.filter(l => this.actionCategory(l.actionType) === this.activeCategory);
    }

    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      list = list.filter(l => new Date(l.timestamp).getTime() >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo).getTime() + 86_400_000; // inclusive day
      list = list.filter(l => new Date(l.timestamp).getTime() <= to);
    }

    this.filtered    = list;
    this.currentPage = 0;
    this.expanded    = null;
  }

  setCategory(key: ActionCategory): void { this.activeCategory = key; this.applyFilter(); }
  goPage(p: number): void { this.currentPage = p; this.expanded = null; }
  toggleExpand(id: number): void { this.expanded = this.expanded === id ? null : id; }

  actionCategory(action: string): string {
    const a = (action || '').toUpperCase();
    if (a.includes('USER') || a.includes('SUSPEND') || a.includes('REACTIVATE') || a.includes('DELETE_USER')) return 'USER';
    if (a.includes('TEMPLATE')) return 'TEMPLATE';
    if (a.includes('RESUME'))   return 'RESUME';
    if (a.includes('SUBSCRI') || a.includes('PLAN'))  return 'SUBSCRIPTION';
    if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('REGISTER') || a.includes('AUTH')) return 'AUTH';
    return 'OTHER';
  }

  formatDate(ts: string): string {
    return ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  }

  formatTime(ts: string): string {
    return ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  }

  formatJson(raw: string | null): string {
    if (!raw) return '';
    try   { return JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  }
}

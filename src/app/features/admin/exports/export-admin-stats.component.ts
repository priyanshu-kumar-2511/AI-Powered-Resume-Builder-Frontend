import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../services/admin-api.service';

export interface ExportAdminStats {
  totalExports: number;
  successCount: number;
  failedCount:  number;
  byFormat:     Record<string, number>;
  topExporters: { userId: number; username: string; exportCount: number }[];
  estimatedStorageKb: number;
}

@Component({
  selector: 'app-export-admin-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">Export Statistics</h1>
          <p class="page-sub">Platform-wide export performance, format breakdown and storage usage</p>
        </div>
        <button class="refresh-btn" (click)="load()">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M4 4v5h5M20 20v-5h-5M15.24 15.24A8 8 0 1 0 8.76 8.76"/>
          </svg>
          Refresh
        </button>
      </div>

      @if (loading) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4]; track i) { <div class="kpi-skeleton"></div> }
        </div>
        <div class="section-skeleton"></div>
      }

      @if (!loading && stats) {
        <!-- KPI row -->
        <div class="kpi-row">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">📦</div>
            <div class="kpi-val">{{ stats.totalExports | number }}</div>
            <div class="kpi-label">Total Exports</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">✅</div>
            <div class="kpi-val">{{ stats.successCount | number }}</div>
            <div class="kpi-label">Successful</div>
            <div class="kpi-sub">{{ successRate }}% success rate</div>
          </div>
          <div class="kpi-card kpi-red">
            <div class="kpi-icon">❌</div>
            <div class="kpi-val">{{ stats.failedCount | number }}</div>
            <div class="kpi-label">Failed</div>
            <div class="kpi-sub">{{ 100 - successRate }}% failure rate</div>
          </div>
          <div class="kpi-card kpi-yellow">
            <div class="kpi-icon">💾</div>
            <div class="kpi-val">{{ storageDisplay }}</div>
            <div class="kpi-label">S3 Storage Est.</div>
            <div class="kpi-sub">7-day retention</div>
          </div>
        </div>

        <div class="two-col">
          <!-- Format breakdown -->
          <div class="section-card">
            <div class="section-title">📊 Exports by Format</div>

            <!-- Donut-like horizontal progress bars -->
            <div class="format-list">
              @for (e of formatEntries; track e.key) {
                <div class="format-item">
                  <div class="format-meta">
                    <div class="format-label">
                      <span class="format-icon">{{ formatIcon(e.key) }}</span>
                      <span class="format-name">{{ e.key }}</span>
                    </div>
                    <span class="format-count">{{ e.value | number }}</span>
                  </div>
                  <div class="format-bar-track">
                    <div class="format-bar" [class]="'fmt-' + e.key.toLowerCase()"
                         [style.width.%]="pct(e.value, stats.totalExports)">
                    </div>
                  </div>
                  <div class="format-pct">{{ pct(e.value, stats.totalExports) }}%</div>
                </div>
              }
              @if (formatEntries.length === 0) {
                <div class="empty-msg">No export format data.</div>
              }
            </div>

            <!-- Success vs Failed visual -->
            <div class="success-section">
              <div class="ss-title">Success vs Failed</div>
              <div class="ss-bar-wrap">
                <div class="ss-bar-track">
                  <div class="ss-success" [style.width.%]="successRate"></div>
                  <div class="ss-failed"  [style.width.%]="100 - successRate"></div>
                </div>
              </div>
              <div class="ss-legend">
                <div class="ss-leg-item">
                  <div class="ss-dot ss-dot-success"></div>
                  <span>Success ({{ successRate }}%)</span>
                </div>
                <div class="ss-leg-item">
                  <div class="ss-dot ss-dot-fail"></div>
                  <span>Failed ({{ 100 - successRate }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top exporters -->
          <div class="section-card">
            <div class="section-title">🏆 Top Exporters</div>
            @if (stats.topExporters.length > 0) {
              <div class="exporters-list">
                @for (u of stats.topExporters; track u.userId; let i = $index) {
                  <div class="exporter-row">
                    <div class="ex-rank">
                      @if (i < 3) {
                        {{ ['🥇','🥈','🥉'][i] }}
                      } @else {
                        <span class="rank-num">{{ i + 1 }}</span>
                      }
                    </div>
                    <div class="ex-user">
                      <div class="ex-av">{{ (u.username || 'U').charAt(0).toUpperCase() }}</div>
                      <span class="ex-name">{{ u.username }}</span>
                    </div>
                    <div class="ex-bar-wrap">
                      <div class="ex-bar-track">
                        <div class="ex-bar" [style.width.%]="pct(u.exportCount, maxExports)"></div>
                      </div>
                    </div>
                    <span class="ex-count">{{ u.exportCount }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-msg">No exporter data available.</div>
            }

            <!-- Storage info -->
            <div class="storage-info">
              <div class="si-title">☁️ S3 Storage Breakdown</div>
              <div class="si-items">
                @for (e of formatEntries; track e.key) {
                  <div class="si-item">
                    <span class="si-format">{{ e.key }}</span>
                    <span class="si-size">~{{ estSizeKb(e.key, e.value) }}</span>
                  </div>
                }
              </div>
              <div class="si-total">
                Total estimated: <strong>{{ storageDisplay }}</strong>
                &nbsp;·&nbsp; Expires in 7 days
              </div>
            </div>
          </div>
        </div>
      }

      @if (!loading && !stats) {
        <div class="error-state">
          <span>⚠️</span>
          <p>Could not load export statistics. Check that the export service is running.</p>
          <button class="refresh-btn" (click)="load()">Try again</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px 36px; max-width: 1100px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: rgba(255,255,255,0.9); margin: 0 0 4px; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin: 0; }
    .refresh-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
    .kpi-skeleton { height: 110px; border-radius: 12px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    .section-skeleton { height: 300px; border-radius: 12px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 4px; }
    .kpi-blue   { border-color: rgba(59,130,246,0.2);  background: rgba(59,130,246,0.04); }
    .kpi-green  { border-color: rgba(34,197,94,0.2);   background: rgba(34,197,94,0.04); }
    .kpi-red    { border-color: rgba(239,68,68,0.2);   background: rgba(239,68,68,0.04); }
    .kpi-yellow { border-color: rgba(245,158,11,0.2);  background: rgba(245,158,11,0.04); }
    .kpi-icon  { font-size: 1.2rem; }
    .kpi-val   { font-size: 1.5rem; font-weight: 800; color: rgba(255,255,255,0.9); }
    .kpi-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); }
    .kpi-sub   { font-size: 0.65rem; color: rgba(255,255,255,0.25); }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .section-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px 22px; }
    .section-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 18px; }

    /* Format bars */
    .format-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .format-item { display: flex; flex-direction: column; gap: 5px; }
    .format-meta { display: flex; justify-content: space-between; align-items: center; }
    .format-label { display: flex; align-items: center; gap: 6px; }
    .format-icon { font-size: 1rem; }
    .format-name { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.7); }
    .format-count { font-size: 0.7rem; color: rgba(255,255,255,0.35); }
    .format-bar-track { height: 10px; background: rgba(255,255,255,0.07); border-radius: 5px; overflow: hidden; }
    .format-bar { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
    .fmt-pdf  { background: linear-gradient(90deg,#ef4444,#dc2626); }
    .fmt-docx { background: linear-gradient(90deg,#3b82f6,#2563eb); }
    .fmt-json { background: linear-gradient(90deg,#f59e0b,#d97706); }
    .format-pct { font-size: 0.68rem; color: rgba(255,255,255,0.3); text-align: right; }

    /* Success vs Failed */
    .success-section { border-top: 1px solid rgba(255,255,255,0.07); padding-top: 16px; }
    .ss-title { font-size: 0.72rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
    .ss-bar-wrap { margin-bottom: 10px; }
    .ss-bar-track { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 2px; }
    .ss-success { background: #22c55e; border-radius: 6px 0 0 6px; }
    .ss-failed  { background: #ef4444; border-radius: 0 6px 6px 0; flex: 1; }
    .ss-legend { display: flex; gap: 16px; }
    .ss-leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.5); }
    .ss-dot { width: 8px; height: 8px; border-radius: 50%; }
    .ss-dot-success { background: #22c55e; }
    .ss-dot-fail    { background: #ef4444; }

    /* Top exporters */
    .exporters-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .exporter-row { display: flex; align-items: center; gap: 10px; }
    .ex-rank { width: 24px; font-size: 1rem; text-align: center; flex-shrink: 0; }
    .rank-num { font-size: 0.7rem; color: rgba(255,255,255,0.25); font-weight: 700; }
    .ex-user { display: flex; align-items: center; gap: 6px; min-width: 120px; }
    .ex-av { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg,#0ea5e9,#0284c7); display: grid; place-items: center; font-size: 0.65rem; font-weight: 700; color: #fff; flex-shrink: 0; }
    .ex-name { font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; }
    .ex-bar-wrap { flex: 1; }
    .ex-bar-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
    .ex-bar { height: 100%; background: linear-gradient(90deg,#0ea5e9,#0284c7); border-radius: 3px; }
    .ex-count { font-size: 0.72rem; color: rgba(255,255,255,0.4); width: 28px; text-align: right; flex-shrink: 0; }

    /* Storage info */
    .storage-info { border-top: 1px solid rgba(255,255,255,0.07); padding-top: 16px; }
    .si-title { font-size: 0.72rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
    .si-items { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
    .si-item { display: flex; justify-content: space-between; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .si-format { font-weight: 600; }
    .si-size { color: rgba(255,255,255,0.35); }
    .si-total { font-size: 0.72rem; color: rgba(255,255,255,0.3); padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
    .si-total strong { color: #f59e0b; }

    .empty-msg { font-size: 0.78rem; color: rgba(255,255,255,0.25); text-align: center; padding: 20px; }
    .error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; color: rgba(255,255,255,0.4); font-size: 0.875rem; text-align: center; }

    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
  `]
})
export class ExportAdminStatsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  stats:   ExportAdminStats | null = null;
  loading  = true;

  get formatEntries() { return Object.entries(this.stats?.byFormat ?? {}).map(([key, value]) => ({ key, value })); }
  get maxExports()    { return Math.max(1, ...(this.stats?.topExporters ?? []).map(e => e.exportCount)); }
  get successRate()   {
    if (!this.stats || this.stats.totalExports === 0) return 0;
    return Math.round((this.stats.successCount / this.stats.totalExports) * 100);
  }
  get storageDisplay(): string {
    const kb = this.stats?.estimatedStorageKb ?? 0;
    if (kb >= 1_048_576) return (kb / 1_048_576).toFixed(1) + ' GB';
    if (kb >= 1_024)     return (kb / 1_024).toFixed(1) + ' MB';
    return kb + ' KB';
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminApi.getExportAdminStats().subscribe({
      next: (raw: any) => {
        // Normalise — backend may return a flat record or a full object
        if (raw && typeof raw === 'object' && 'totalExports' in raw) {
          this.stats = raw as ExportAdminStats;
        } else {
          // Legacy flat byFormat map
          const byFormat = raw as Record<string, number>;
          const total    = Object.values(byFormat).reduce((a, b) => a + b, 0);
          this.stats = {
            totalExports: total, successCount: total, failedCount: 0,
            byFormat, topExporters: [], estimatedStorageKb: total * 200
          };
        }
        this.loading = false;
      },
      error: () => { this.stats = null; this.loading = false; }
    });
  }

  pct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  formatIcon(fmt: string): string {
    const icons: Record<string, string> = { PDF: '📄', DOCX: '📝', JSON: '🔧' };
    return icons[fmt.toUpperCase()] ?? '📦';
  }

  estSizeKb(fmt: string, count: number): string {
    const sizes: Record<string, number> = { PDF: 300, DOCX: 120, JSON: 15 };
    const kb = (sizes[fmt.toUpperCase()] ?? 200) * count;
    if (kb >= 1_024) return (kb / 1_024).toFixed(1) + ' MB';
    return kb + ' KB';
  }
}

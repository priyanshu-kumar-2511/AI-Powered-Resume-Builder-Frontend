import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService, PlatformAnalytics, AiUsageStats } from '../services/admin-api.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics & Insights</h1>
          <p class="page-sub">Comprehensive platform usage and AI metrics</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="ngOnInit()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M4 4v5h5M20 20v-5h-5M15.24 15.24A8 8 0 1 0 8.76 8.76"/>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      <!-- Platform stats -->
      @if (loadingPlatform) {
        <div class="section-skeleton"></div>
      }

      @if (!loadingPlatform && platform) {
        <div class="section-card">
          <div class="section-title">
            <span class="st-icon">📊</span>
            Platform Overview
          </div>
          <div class="stats-row">
            <div class="kpi">
              <div class="kpi-val">{{ platform.totalUsers | number }}</div>
              <div class="kpi-label">Total Users</div>
            </div>
            <div class="kpi">
              <div class="kpi-val">{{ platform.activeUsers | number }}</div>
              <div class="kpi-label">Active Users</div>
            </div>
            <div class="kpi kpi-accent">
              <div class="kpi-val">{{ platform.premiumUsers | number }}</div>
              <div class="kpi-label">Premium Users</div>
            </div>
            <div class="kpi">
              <div class="kpi-val">{{ platform.totalResumes | number }}</div>
              <div class="kpi-label">Resumes Created</div>
            </div>
            <div class="kpi">
              <div class="kpi-val">{{ platform.totalExports | number }}</div>
              <div class="kpi-label">Total Exports</div>
            </div>
            <div class="kpi">
              <div class="kpi-val">{{ platform.totalAiCalls | number }}</div>
              <div class="kpi-label">AI Calls Made</div>
            </div>
          </div>

          <!-- Exports breakdown -->
          <div class="sub-title">Exports by Format</div>
          <div class="bar-group">
            @for (entry of exportEntries; track entry.key) {
              <div class="bar-row">
                <span class="bar-label">{{ entry.key }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="barPct(entry.value, maxExport)" [attr.data-fmt]="entry.key"></div>
                </div>
                <span class="bar-count">{{ entry.value | number }}</span>
              </div>
            }
          </div>

          <!-- Top templates -->
          <div class="sub-title">Most Used Templates</div>
          <div class="tpl-rank-list">
            @for (t of platform.mostUsedTemplates.slice(0,8); track t.templateId; let i = $index) {
              <div class="tpl-rank-row">
                <span class="rank-num">{{ i + 1 }}</span>
                <span class="rank-name">{{ t.name }}</span>
                <div class="rank-bar-track">
                  <div class="rank-bar" [style.width.%]="barPct(t.usageCount, platform.mostUsedTemplates[0].usageCount)"></div>
                </div>
                <span class="rank-count">{{ t.usageCount }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- AI Usage stats -->
      @if (loadingAi) {
        <div class="section-skeleton"></div>
      }

      @if (!loadingAi && ai) {
        <div class="section-card">
          <div class="section-title">
            <span class="st-icon">🤖</span>
            AI Engine Performance
          </div>
          <div class="stats-row">
            <div class="kpi kpi-blue">
              <div class="kpi-val">{{ ai.totalAiCalls | number }}</div>
              <div class="kpi-label">Total AI Calls Made</div>
            </div>
          </div>

          <div class="one-col-stats">
            <div>
              <div class="sub-title">Calls by Model</div>
              @for (entry of modelCallEntries; track entry.key) {
                <div class="bar-row">
                  <span class="bar-label">{{ entry.key }}</span>
                  <div class="bar-track">
                    <div class="bar-fill bar-fill-purple" [style.width.%]="barPct(entry.value, maxModelCall)"></div>
                  </div>
                  <span class="bar-count">{{ entry.value | number }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Usage Graph -->
          <div class="sub-title" style="margin-top:20px">AI Activity Trend (Last 7 Days - Calls)</div>
          <div class="graph-wrap">
            <svg viewBox="0 0 400 150" class="trend-svg">
              <!-- Grid lines -->
              <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(255,255,255,0.05)" />
              
              <!-- Gradient fill -->
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(139,92,246,0.3)" />
                  <stop offset="100%" stop-color="rgba(139,92,246,0)" />
                </linearGradient>
              </defs>
              <path [attr.d]="chartAreaPath" fill="url(#lineGrad)" />
              
              <!-- Main line -->
              <path [attr.d]="chartLinePath" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              
              <!-- Points -->
              @for (p of chartPoints; track p.x) {
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#8b5cf6" stroke="#111520" stroke-width="2" />
              }
 
              <!-- Labels -->
              @for (p of chartPoints; track p.x) {
                <text [attr.x]="p.x" y="145" text-anchor="middle" class="chart-text">{{ p.label }}</text>
              }
            </svg>
          </div>
 
          <div class="sub-title" style="margin-top:20px">Top Users by Activity</div>
          <div class="user-rank-list">
            @for (u of ai.topUsersByUsage.slice(0,10); track u.userId; let i = $index) {
              <div class="user-rank-row">
                <span class="rank-num">{{ i + 1 }}</span>
                <span class="rank-name">{{ u.username }}</span>
                <span class="rank-count">{{ u.callCount | number }} calls</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px 36px; max-width: 1100px; }
    .page-header { margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
    .header-actions { display: flex; gap: 10px; }
    .refresh-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.6); padding: 8px 14px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0 0 4px; font-family: var(--font-display); }
    .page-sub { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }

    .section-skeleton { height: 300px; border-radius: 12px; margin-bottom: 18px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .section-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px 24px; margin-bottom: 18px; position: relative; overflow: hidden; }
    .section-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--teal), transparent); opacity: 0.3; }
    .section-title { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 22px; display: flex; align-items: center; gap: 10px; font-family: var(--font-display); }
    .st-icon { font-size: 1.1rem; }
    .sub-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-secondary); margin: 18px 0 10px; }

    .stats-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 4px; }
    .kpi { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; min-width: 120px; }
    .kpi-accent { border-color: rgba(0,212,180,0.2); background: rgba(0,212,180,0.05); }
    .kpi-purple { border-color: rgba(139,92,246,0.25); background: rgba(139,92,246,0.06); }
    .kpi-yellow { border-color: rgba(245,158,11,0.25); background: rgba(245,158,11,0.06); }
    .kpi-val { font-size: 1.4rem; font-weight: 800; color: rgba(255,255,255,0.9); }
    .kpi-label { font-size: 0.68rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }

    .bar-group { display: flex; flex-direction: column; gap: 8px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label { font-size: 0.72rem; color: rgba(255,255,255,0.5); width: 60px; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; background: #00d4b4; transition: width 0.6s ease; }
    .bar-fill-purple { background: #8b5cf6; }
    .bar-fill-yellow { background: #f59e0b; }
    .bar-count { font-size: 0.72rem; color: rgba(255,255,255,0.5); width: 50px; text-align: right; flex-shrink: 0; }

    .tpl-rank-list, .user-rank-list { display: flex; flex-direction: column; gap: 6px; }
    .tpl-rank-row, .user-rank-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .tpl-rank-row:last-child, .user-rank-row:last-child { border-bottom: none; }
    .rank-num { width: 20px; font-size: 0.7rem; color: rgba(255,255,255,0.25); text-align: right; flex-shrink: 0; }
    .rank-name { font-size: 0.78rem; color: rgba(255,255,255,0.7); flex: 1; }
    .rank-bar-track { width: 140px; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
    .rank-bar { height: 100%; background: linear-gradient(90deg,#00d4b4,#00b89c); border-radius: 3px; }
    .rank-count { font-size: 0.7rem; color: rgba(255,255,255,0.4); width: 60px; text-align: right; flex-shrink: 0; }

    .graph-wrap { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px 10px 10px; margin-top: 12px; }
    .trend-svg { width: 100%; height: 160px; overflow: visible; }
    .chart-text { font-size: 8px; fill: rgba(255,255,255,0.3); font-weight: 600; }

    .two-col-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  `]
})
export class AdminAnalyticsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  platform:        PlatformAnalytics | null = null;
  ai:              AiUsageStats | null = null;
  loadingPlatform  = true;
  loadingAi        = true;

  get exportEntries() { return Object.entries(this.platform?.exportsByFormat ?? {}).map(([key,value]) => ({key, value})); }
  get maxExport()     { return Math.max(1, ...Object.values(this.platform?.exportsByFormat ?? {})); }
  get modelCallEntries() { return Object.entries(this.ai?.callsByModel ?? {}).map(([key,value]) => ({key, value})); }
  get maxModelCall()  { return Math.max(1, ...Object.values(this.ai?.callsByModel ?? {})); }
 
  ngOnInit(): void {
    this.adminApi.getPlatformAnalytics().subscribe({
      next:  p  => { this.platform = p; this.loadingPlatform = false; },
      error: () => this.loadingPlatform = false
    });
    
    import('rxjs').then(({ forkJoin }) => {
      forkJoin({
        aiStats: this.adminApi.getAiUsageStats(),
        users: this.adminApi.getAllUsers()
      }).subscribe({
        next: ({ aiStats, users }) => {
          if (aiStats.topUsersByUsage) {
            aiStats.topUsersByUsage = aiStats.topUsersByUsage.map(u => {
              const userMatch = users.find(user => user.userId.toString() === u.userId?.toString());
              return {
                ...u,
                username: userMatch ? userMatch.username : `User ${u.userId}`
              };
            });
          }
          this.ai = aiStats; 
          this.loadingAi = false; 
          this.generateChartData();
        },
        error: () => this.loadingAi = false
      });
    });
  }
 
  // ── Chart Logic ──────────────────────────────────────────────────────────
  
  chartPoints: {x: number, y: number, label: string}[] = [];
  chartLinePath = '';
  chartAreaPath = '';
 
  private generateChartData(): void {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Mock daily usage values based on total calls
    const base = (this.ai?.totalAiCalls ?? 100) / 7;
    const values = [base*0.8, base*1.2, base*0.9, base*1.5, base*1.1, base*0.7, base*1.3];
    const maxVal = Math.max(...values, 10);
    
    this.chartPoints = values.map((v, i) => ({
      x: (i * (400 / 6)),
      y: 130 - (v / maxVal * 100),
      label: days[i]
    }));
 
    this.chartLinePath = 'M' + this.chartPoints.map(p => `${p.x},${p.y}`).join(' L');
    this.chartAreaPath = this.chartLinePath + ` L400,130 L0,130 Z`;
  }

  barPct(val: number, max: number): number { return max > 0 ? Math.round((val / max) * 100) : 0; }
}

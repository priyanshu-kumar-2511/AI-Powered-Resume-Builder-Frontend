import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService, AiUsageStats } from '../services/admin-api.service';

@Component({
  selector: 'app-ai-usage-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">AI Usage Statistics</h1>
          <p class="page-sub">Token consumption, cost breakdown and top consumers</p>
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
        <!-- Top KPIs -->
        <div class="kpi-row">
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">🤖</div>
            <div class="kpi-val">{{ stats.totalTokensUsed | number }}</div>
            <div class="kpi-label">Total Tokens Used</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">💰</div>
            <div class="kpi-val">$ {{ stats.totalCostEstimate.toFixed(4) }}</div>
            <div class="kpi-label">Estimated Cost (USD)</div>
          </div>
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">📞</div>
            <div class="kpi-val">{{ totalCalls | number }}</div>
            <div class="kpi-label">Total API Calls</div>
          </div>
          <div class="kpi-card kpi-yellow">
            <div class="kpi-icon">⚡</div>
            <div class="kpi-val">{{ avgTokensPerCall | number }}</div>
            <div class="kpi-label">Avg Tokens / Call</div>
          </div>
        </div>

        <!-- Model breakdown -->
        <div class="two-col">
          <!-- Calls by model -->
          <div class="section-card">
            <div class="section-title">📊 API Calls by Model</div>
            <div class="bar-group">
              @for (e of callEntries; track e.key) {
                <div class="bar-item">
                  <div class="bar-meta">
                    <span class="bar-model">{{ e.key }}</span>
                    <span class="bar-count">{{ e.value | number }} calls</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill"
                         [class.fill-gpt]="e.key.toLowerCase().includes('gpt')"
                         [class.fill-claude]="e.key.toLowerCase().includes('claude')"
                         [style.width.%]="pct(e.value, maxCalls)">
                    </div>
                  </div>
                  <div class="bar-pct">{{ pct(e.value, maxCalls) }}%</div>
                </div>
              }
              @if (callEntries.length === 0) {
                <div class="empty-msg">No model call data available.</div>
              }
            </div>
          </div>

          <!-- Tokens by model -->
          <div class="section-card">
            <div class="section-title">🔢 Token Usage by Model</div>
            <div class="bar-group">
              @for (e of tokenEntries; track e.key) {
                <div class="bar-item">
                  <div class="bar-meta">
                    <span class="bar-model">{{ e.key }}</span>
                    <span class="bar-count">{{ e.value | number }} tokens</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill"
                         [class.fill-gpt]="e.key.toLowerCase().includes('gpt')"
                         [class.fill-claude]="e.key.toLowerCase().includes('claude')"
                         [style.width.%]="pct(e.value, maxTokens)">
                    </div>
                  </div>
                  <div class="bar-pct">{{ pct(e.value, maxTokens) }}%</div>
                </div>
              }
              @if (tokenEntries.length === 0) {
                <div class="empty-msg">No token data available.</div>
              }
            </div>

            <!-- Donut-style cost split -->
            @if (tokenEntries.length >= 2) {
              <div class="cost-split">
                <div class="cs-title">Cost split estimate</div>
                <div class="cs-bars">
                  @for (e of tokenEntries; track e.key) {
                    <div class="cs-segment"
                         [class.cs-gpt]="e.key.toLowerCase().includes('gpt')"
                         [class.cs-claude]="e.key.toLowerCase().includes('claude')"
                         [style.flex]="e.value"
                         [title]="e.key + ': ' + pct(e.value, maxTokens) + '%'">
                    </div>
                  }
                </div>
                <div class="cs-legend">
                  @for (e of tokenEntries; track e.key) {
                    <div class="cs-leg-item">
                      <div class="cs-dot" [class.dot-gpt]="e.key.toLowerCase().includes('gpt')" [class.dot-claude]="e.key.toLowerCase().includes('claude')"></div>
                      <span>{{ e.key }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Top users table -->
        <div class="section-card">
          <div class="section-title">🏆 Top Users by Token Consumption</div>
          <div class="users-table-wrap">
            <table class="users-table">
              <thead>
                <tr>
                  <th>#</th><th>User</th><th>Tokens Used</th>
                  <th>Est. Cost</th><th>Usage Share</th>
                </tr>
              </thead>
              <tbody>
                @for (u of stats.topUsersByUsage; track u.userId; let i = $index) {
                  <tr>
                    <td class="rank-cell">
                      @if (i < 3) {
                        <span class="medal">{{ ['🥇','🥈','🥉'][i] }}</span>
                      } @else {
                        <span class="rank-num">{{ i + 1 }}</span>
                      }
                    </td>
                    <td>
                      <div class="user-cell">
                        <div class="user-av">{{ (u.username || 'U').charAt(0).toUpperCase() }}</div>
                        <span class="user-name">{{ u.username }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="tokens-cell">
                        <div class="token-bar-track">
                          <div class="token-bar" [style.width.%]="pct(u.tokensUsed, maxUserTokens)"></div>
                        </div>
                        <span class="token-count">{{ u.tokensUsed | number }}</span>
                      </div>
                    </td>
                    <td class="cost-cell">$ {{ (u.tokensUsed * 0.000002).toFixed(4) }}</td>
                    <td class="share-cell">{{ pct(u.tokensUsed, stats.totalTokensUsed) }}%</td>
                  </tr>
                }
                @if (stats.topUsersByUsage.length === 0) {
                  <tr><td colspan="5" class="empty-row">No user data available.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (!loading && !stats) {
        <div class="error-state">
          <span class="error-icon">⚠️</span>
          <p>Could not load AI usage statistics. Make sure the AI service is running.</p>
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
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
    .kpi-purple { border-color: rgba(139,92,246,0.25); background: rgba(139,92,246,0.05); }
    .kpi-green  { border-color: rgba(34,197,94,0.2);  background: rgba(34,197,94,0.05); }
    .kpi-blue   { border-color: rgba(59,130,246,0.2); background: rgba(59,130,246,0.05); }
    .kpi-yellow { border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.05); }
    .kpi-icon { font-size: 1.2rem; }
    .kpi-val { font-size: 1.5rem; font-weight: 800; color: rgba(255,255,255,0.9); }
    .kpi-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .section-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; }
    .section-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 18px; }

    .bar-group { display: flex; flex-direction: column; gap: 14px; }
    .bar-item { display: flex; flex-direction: column; gap: 5px; }
    .bar-meta { display: flex; justify-content: space-between; align-items: center; }
    .bar-model { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.7); }
    .bar-count { font-size: 0.7rem; color: rgba(255,255,255,0.35); }
    .bar-track { height: 10px; background: rgba(255,255,255,0.07); border-radius: 5px; overflow: hidden; flex: 1; }
    .bar-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; background: #8b5cf6; }
    .fill-gpt    { background: linear-gradient(90deg,#10b981,#059669); }
    .fill-claude { background: linear-gradient(90deg,#8b5cf6,#7c3aed); }
    .bar-pct { font-size: 0.68rem; color: rgba(255,255,255,0.3); text-align: right; }

    .cost-split { margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 16px; }
    .cs-title { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
    .cs-bars { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 2px; }
    .cs-segment { border-radius: 4px; }
    .cs-gpt    { background: linear-gradient(90deg,#10b981,#059669); }
    .cs-claude { background: linear-gradient(90deg,#8b5cf6,#7c3aed); }
    .cs-legend { display: flex; gap: 16px; margin-top: 8px; }
    .cs-leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.5); }
    .cs-dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-gpt    { background: #10b981; }
    .dot-claude { background: #8b5cf6; }

    .empty-msg { font-size: 0.78rem; color: rgba(255,255,255,0.25); text-align: center; padding: 20px; }

    .users-table-wrap { overflow-x: auto; }
    .users-table { width: 100%; border-collapse: collapse; }
    .users-table thead { background: rgba(255,255,255,0.03); }
    .users-table th { padding: 10px 14px; text-align: left; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.07); }
    .users-table td { padding: 11px 14px; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .users-table tr:last-child td { border-bottom: none; }
    .users-table tr:hover td { background: rgba(255,255,255,0.02); }
    .empty-row { text-align: center; color: rgba(255,255,255,0.25); padding: 32px !important; }

    .rank-cell { text-align: center; width: 40px; }
    .medal { font-size: 1.1rem; }
    .rank-num { font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 700; }

    .user-cell { display: flex; align-items: center; gap: 8px; }
    .user-av { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#8b5cf6,#6d28d9); display: grid; place-items: center; font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0; }
    .user-name { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8); }

    .tokens-cell { display: flex; align-items: center; gap: 10px; }
    .token-bar-track { width: 100px; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
    .token-bar { height: 100%; background: linear-gradient(90deg,#8b5cf6,#7c3aed); border-radius: 3px; }
    .token-count { font-size: 0.75rem; color: rgba(255,255,255,0.6); white-space: nowrap; }
    .cost-cell { color: #f59e0b; font-size: 0.78rem; font-weight: 600; }
    .share-cell { color: rgba(255,255,255,0.4); font-size: 0.75rem; }

    .error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; color: rgba(255,255,255,0.4); font-size: 0.875rem; text-align: center; }
    .error-icon { font-size: 2.5rem; }

    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
  `]
})
export class AiUsageStatsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  stats:   AiUsageStats | null = null;
  loading  = true;

  get callEntries()  { return Object.entries(this.stats?.callsByModel  ?? {}).map(([key, value]) => ({ key, value })); }
  get tokenEntries() { return Object.entries(this.stats?.tokensByModel ?? {}).map(([key, value]) => ({ key, value })); }
  get maxCalls()     { return Math.max(1, ...Object.values(this.stats?.callsByModel  ?? {})); }
  get maxTokens()    { return Math.max(1, ...Object.values(this.stats?.tokensByModel ?? {})); }
  get totalCalls()   { return Object.values(this.stats?.callsByModel ?? {}).reduce((a, b) => a + b, 0); }
  get avgTokensPerCall(): number {
    return this.totalCalls > 0 ? Math.round((this.stats?.totalTokensUsed ?? 0) / this.totalCalls) : 0;
  }
  get maxUserTokens(): number {
    return Math.max(1, ...(this.stats?.topUsersByUsage ?? []).map(u => u.tokensUsed));
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminApi.getAiUsageStats().subscribe({
      next:  s  => { this.stats = s; this.loading = false; },
      error: () => { this.stats = null; this.loading = false; }
    });
  }

  pct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }
}

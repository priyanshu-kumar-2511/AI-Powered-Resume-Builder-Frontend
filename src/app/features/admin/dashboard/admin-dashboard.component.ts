import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminApiService, PlatformAnalytics, AiUsageStats } from '../services/admin-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">

      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <div class="admin-logo">R</div>
          <div>
            <div class="admin-brand-name">ResumeAI</div>
            <div class="admin-role-badge">Admin Panel</div>
          </div>
        </div>

        <nav class="admin-nav">
          @for (item of navItems; track item.path) {
            <a class="admin-nav-item"
               [routerLink]="item.path"
               routerLinkActive="active">
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="admin-sidebar-footer">
          <div class="admin-user-info">
            <div class="admin-avatar">{{ adminInitial }}</div>
            <div>
              <div class="admin-user-name">{{ adminName }}</div>
              <div class="admin-user-role">Administrator</div>
            </div>
          </div>
          <button (click)="logout()" class="admin-logout-btn" title="Sign out of platform">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="admin-main">

        <!-- Stats overview (only on /admin exact) -->
        @if (isDashboardRoot) {
          <div class="admin-content-wrap">
            <div class="admin-page-header">
              <h1 class="admin-page-title">Dashboard Overview</h1>
              <p class="admin-page-sub">Platform summary — real-time</p>
            </div>

            @if (loading) {
              <div class="admin-stats-grid">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="stat-skeleton"></div>
                }
              </div>
            }

            @if (!loading && analytics) {
              <div class="admin-stats-grid">
                <div class="stat-card">
                  <div class="stat-icon" style="background:rgba(59,130,246,.12);color:#93c5fd">👥</div>
                  <div class="stat-value">{{ analytics.totalUsers | number }}</div>
                  <div class="stat-label">Total Users</div>
                  <div class="stat-sub">{{ analytics.activeUsers }} active · {{ analytics.premiumUsers }} premium</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon" style="background:rgba(0,212,180,.1);color:#00d4b4">📄</div>
                  <div class="stat-value">{{ analytics.totalResumes | number }}</div>
                  <div class="stat-label">Total Resumes</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon" style="background:rgba(139,92,246,.12);color:#c4b5fd">🤖</div>
                  <div class="stat-value">{{ analytics.totalAiCalls | number }}</div>
                  <div class="stat-label">AI Calls Made</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon" style="background:rgba(234,179,8,.12);color:#fde68a">📦</div>
                  <div class="stat-value">{{ analytics.totalExports | number }}</div>
                  <div class="stat-label">Total Exports</div>
                  <div class="stat-sub">
                    PDF: {{ analytics.exportsByFormat['PDF'] }} &nbsp;·&nbsp;
                    DOCX: {{ analytics.exportsByFormat['DOCX'] }}
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#fde68a">💰</div>
                  <div class="stat-value">$ {{ aiStats ? aiStats.totalCostEstimate.toFixed(2) : '—' }}</div>
                  <div class="stat-label">AI Cost (USD)</div>
                  <div class="stat-sub">{{ aiStats ? (aiStats.totalTokensUsed | number) + ' tokens' : 'Loading…' }}</div>
                </div>
                <div class="stat-card stat-card-wide">
                  <div class="stat-label" style="margin-bottom:12px">🏆 Most Used Templates</div>
                  @for (t of analytics.mostUsedTemplates.slice(0,5); track t.templateId) {
                    <div class="tpl-row">
                      <span class="tpl-name">{{ t.name }}</span>
                      <span class="tpl-count">{{ t.usageCount }} uses</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Quick nav cards -->
              <div class="quick-nav-grid">
                @for (item of navItems; track item.path) {
                  <a class="quick-nav-card" [routerLink]="item.path">
                    <span class="qnc-icon">{{ item.icon }}</span>
                    <span class="qnc-label">{{ item.label }}</span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </a>
                }
              </div>
            }
          </div>
        }

        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .admin-shell {
      display: flex; min-height: 100vh;
      background: radial-gradient(circle at top right, #111827, #080b12);
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    /* Sidebar */
    .admin-sidebar {
      width: 260px; flex-shrink: 0;
      background: rgba(14, 20, 34, 0.95);
      backdrop-filter: blur(10px);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      display: flex; flex-direction: column;
      position: fixed; left: 0; top: 0; bottom: 0;
      z-index: 50;
    }

    .admin-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 18px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .admin-logo {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg,#00d4b4,#00b89c);
      display: grid; place-items: center;
      font-size: 1rem; font-weight: 800; color: #000;
      flex-shrink: 0;
    }
    .admin-brand-name { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.9); }
    .admin-role-badge {
      font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
      color: #f59e0b; background: rgba(245,158,11,0.1); border-radius: 4px;
      padding: 1px 6px; margin-top: 2px; display: inline-block;
    }

    .admin-nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 10px;
      color: rgba(255,255,255,0.5); text-decoration: none;
      font-size: 0.88rem; font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 4px;
    }
    .admin-nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .admin-nav-item.active { 
      background: rgba(0,212,180,0.1); 
      color: var(--teal); 
      font-weight: 600;
      box-shadow: inset 4px 0 0 var(--teal);
    }
    .nav-icon { font-size: 1.1rem; width: 24px; text-align: center; }

    .admin-sidebar-footer {
      padding: 14px 12px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column; gap: 10px;
    }
    .admin-user-info { display: flex; align-items: center; gap: 9px; }
    .admin-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg,#00d4b4,#00b89c);
      display: grid; place-items: center;
      font-size: 0.85rem; font-weight: 700; color: #000; flex-shrink: 0;
    }
    .admin-user-name { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.8); }
    .admin-user-role { font-size: 0.65rem; color: rgba(255,255,255,0.3); }
    .admin-logout-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 10px; border-radius: 7px;
      background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
      color: #f87171; cursor: pointer; font-size: 0.78rem; font-weight: 600;
      transition: all 0.2s; font-family: inherit; width: 100%; justify-content: center;
    }
    .admin-logout-btn:hover { background: rgba(239,68,68,0.12); color: #ff8a8a; }

    /* Main */
    .admin-main { margin-left: 240px; flex: 1; min-height: 100vh; }
    .admin-content-wrap { padding: 32px 36px; max-width: 1200px; }

    .admin-page-header { margin-bottom: 28px; }
    .admin-page-title { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0 0 4px; font-family: var(--font-display); }
    .admin-page-sub { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }

    /* Stats grid */
    .admin-stats-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px; margin-bottom: 28px;
    }
    .stat-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 18px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .stat-card-wide { grid-column: span 2; }
    .stat-icon { width: 36px; height: 36px; border-radius: 9px; display: grid; place-items: center; font-size: 1.1rem; margin-bottom: 4px; }
    .stat-value { font-size: 1.6rem; font-weight: 800; color: rgba(255,255,255,0.9); }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); }
    .stat-sub { font-size: 0.7rem; color: rgba(255,255,255,0.25); }
    .stat-skeleton { height: 110px; border-radius: 12px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .tpl-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem; }
    .tpl-name { color: rgba(255,255,255,0.7); }
    .tpl-count { color: #00d4b4; font-weight: 600; }

    /* Quick nav */
    .quick-nav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
    .quick-nav-card {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-radius: 10px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      text-decoration: none; color: rgba(255,255,255,0.6);
      font-size: 0.8rem; font-weight: 500;
      transition: all 0.2s;
    }
    .quick-nav-card:hover { background: rgba(0,212,180,0.06); border-color: rgba(0,212,180,0.2); color: #00d4b4; }
    .qnc-icon { font-size: 1.1rem; }
    .qnc-label { flex: 1; }

    @media (max-width: 900px) {
      .admin-sidebar { width: 70px; }
      .admin-brand-name, .admin-role-badge, .admin-nav-item span:not(.nav-icon), .admin-user-info div, .admin-logout-btn span:not(svg) { display: none; }
      .admin-nav-item, .admin-logout-btn { justify-content: center; padding: 12px; }
      .admin-main { margin-left: 70px; }
      .admin-sidebar-footer { padding: 10px 6px; }
      .stat-card-wide { grid-column: span 1; }
    }

    @media (max-width: 600px) {
      .admin-sidebar { display: none; }
      .admin-main { margin-left: 0; }
      .admin-content-wrap { padding: 20px 16px; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private auth     = inject(AuthService);
  private router   = inject(Router);

  analytics: PlatformAnalytics | null = null;
  aiStats:   AiUsageStats | null = null;
  loading    = true;

  get isDashboardRoot(): boolean {
    return this.router.url === '/admin';
  }

  readonly navItems = [
    { path: '/admin/users',      icon: '👥', label: 'User Management'   },
    { path: '/admin/resumes',    icon: '📄', label: 'Resumes'           },
    { path: '/admin/templates',  icon: '🎨', label: 'Templates'         },
    { path: '/admin/analytics',  icon: '📊', label: 'Analytics'         },
    { path: '/admin/ai-stats',   icon: '🤖', label: 'AI Usage'          },
    { path: '/admin/subscriptions', icon: '💰', label: 'Subscriptions'    },
    { path: '/admin/exports',    icon: '📦', label: 'Export Stats'      },
    { path: '/admin/broadcast',  icon: '📢', label: 'Broadcast'         },
    { path: '/admin/audit',      icon: '🕵️', label: 'Audit Logs'        },
  ];

  get adminName(): string { return this.auth.currentUser()?.fullName ?? 'Admin'; }
  get adminInitial(): string { return this.adminName.charAt(0).toUpperCase(); }

  ngOnInit(): void {
    if (!this.isDashboardRoot) {
      this.loading = false;
      return;
    }

    this.adminApi.getPlatformAnalytics().subscribe({
      next:  a  => { this.analytics = a; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.adminApi.getAiUsageStats().subscribe({
      next:  s  => { this.aiStats = s; },
      error: () => { this.aiStats = null; }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}

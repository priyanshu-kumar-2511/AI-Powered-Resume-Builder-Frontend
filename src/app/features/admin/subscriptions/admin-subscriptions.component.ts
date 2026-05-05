import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminPaymentService, SubscriptionStats, AdminSubscriptionResponse } from '../../../core/services/admin-payment.service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-subs">
      <div class="admin-header">
        <div>
          <h1>Subscription Management</h1>
          <p>Monitor revenue, active plans, and payment history.</p>
        </div>
      </div>

      <!-- Stats Grid -->
      @if (stats) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value gold">₹{{ stats.totalRevenueInPaise / 100 | number:'1.2-2' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Active Plans</span>
            <span class="stat-value teal">{{ stats.totalActiveSubscriptions }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Cancelled (Pending Expiry)</span>
            <span class="stat-value orange">{{ stats.totalCancelledSubscriptions }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Yearly vs Monthly</span>
            <span class="stat-value subtitle">
              Y: {{ stats.planDistribution['YEARLY'] || 0 }} | M: {{ stats.planDistribution['MONTHLY'] || 0 }}
            </span>
          </div>
        </div>
      }

      <!-- Subscriptions Table -->
      <div class="card table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Cycle</th>
              <th>Status</th>
              <th>Payment ID</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            @for (sub of subscriptions; track sub.id) {
              <tr>
                <td>
                  <div class="user-cell">
                    <strong>{{ sub.fullName }}</strong>
                    <span>&#64;{{ sub.username }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gold">{{ sub.plan }}</span></td>
                <td>{{ sub.billingCycle }}</td>
                <td>
                  <span class="status-indicator" [class]="sub.status.toLowerCase()">
                    {{ sub.status }}
                  </span>
                </td>
                <td class="mono">{{ sub.razorpayPaymentId }}</td>
                <td>{{ sub.startDate | date:'shortDate' }}</td>
                <td>{{ sub.endDate | date:'shortDate' }}</td>
              </tr>
            }
            @if (subscriptions.length === 0 && !loading) {
              <tr><td colspan="7" class="empty-row">No subscriptions found.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Placeholder -->
      <div class="pagination" style="margin-top:20px; display:flex; justify-content:center; gap:10px">
         <button class="btn btn-outline btn-sm" disabled>Previous</button>
         <button class="btn btn-outline btn-sm" disabled>Next</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-subs { padding: 20px; }
    .admin-header { margin-bottom: 32px; }
    .admin-header h1 { font-size: 1.8rem; margin-bottom: 4px; }
    .admin-header p { color: var(--text-muted); font-size: 0.9rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card { background: var(--bg-card); border: 1px solid var(--border); padding: 24px; border-radius: 16px; }
    .stat-label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
    .stat-value { font-size: 1.8rem; font-weight: 700; }
    .stat-value.gold { color: #f59e0b; }
    .stat-value.teal { color: #00d4b4; }
    .stat-value.orange { color: #f97316; }
    .stat-value.subtitle { font-size: 1.1rem; color: var(--text-primary); }

    .table-container { overflow-x: auto; padding: 0; }
    .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
    .admin-table th { padding: 16px; background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
    .admin-table td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    
    .user-cell { display: flex; flex-direction: column; }
    .user-cell span { font-size: 0.75rem; color: var(--text-muted); }
    .mono { font-family: monospace; color: var(--text-muted); font-size: 0.8rem; }
    .empty-row { text-align: center; padding: 40px !important; color: var(--text-muted); }

    .status-indicator { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
    .status-indicator.active { background: rgba(0,212,180,0.1); color: #00d4b4; }
    .status-indicator.cancelled { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .status-indicator.expired { background: rgba(255,255,255,0.05); color: var(--text-muted); }
  `]
})
export class AdminSubscriptionsComponent implements OnInit {
  private adminPaymentSvc = inject(AdminPaymentService);

  subscriptions: AdminSubscriptionResponse[] = [];
  stats: SubscriptionStats | null = null;
  loading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.adminPaymentSvc.getStats().subscribe(s => this.stats = s);
    this.adminPaymentSvc.getSubscriptions().subscribe({
      next: (res) => {
        this.subscriptions = res.content;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}

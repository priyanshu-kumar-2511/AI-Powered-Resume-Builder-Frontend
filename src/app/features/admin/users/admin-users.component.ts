import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminUser } from '../services/admin-api.service';

type ModalType = 'delete' | 'suspend' | 'role' | 'detail' | null;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-sub">{{ filtered.length }} of {{ users.length }} users</p>
        </div>
        <div class="header-controls">
          <div class="date-filters">
            <input type="date" class="date-input" [(ngModel)]="dateFrom"
                   (ngModelChange)="applyFilter()" title="Joined from">
            <span class="date-sep">→</span>
            <input type="date" class="date-input" [(ngModel)]="dateTo"
                   (ngModelChange)="applyFilter()" title="Joined up to">
          </div>
          <input class="search-input" placeholder="Search by name, email or username…"
                 [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()">
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        @for (f of filters; track f.key) {
          <button class="filter-btn" [class.active]="activeFilter === f.key" (click)="setFilter(f.key)">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Table -->
      @if (loading) {
        <div class="table-skeletons">
          @for (i of [1,2,3,4,5]; track i) { <div class="row-skeleton"></div> }
        </div>
      }

      @if (!loading) {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Role</th><th>Subscription Plan</th>
                <th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filtered; track user.userId) {
                <tr (click)="openDetail(user)" style="cursor: pointer" title="View user history">
                  <!-- User cell -->
                  <td>
                    <div class="user-cell">
                      <div class="user-av" [class.av-admin]="isAdmin(user)">
                        {{ user.fullName.charAt(0) }}
                      </div>
                      <div>
                        <div class="user-name">{{ user.fullName }}</div>
                        <div class="user-un">{{ user.username }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Email -->
                  <td class="td-muted">{{ user.email }}</td>

                  <!-- Role pill + change button -->
                  <td>
                    <div class="role-cell">
                      <span class="role-pill" [class.role-admin]="isAdmin(user)" [class.role-user]="!isAdmin(user)">
                        {{ isAdmin(user) ? 'Admin' : 'User' }}
                      </span>
                      <button class="act-btn role-toggle-btn"
                              (click)="$event.stopPropagation(); confirmRoleChange(user)"
                              [disabled]="busy === user.userId"
                              [title]="isAdmin(user) ? 'Demote to User' : 'Promote to Admin'">
                        @if (isAdmin(user)) {
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
                        } @else {
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 11l-5-5-5 5M17 18l-5-5-5 5"/></svg>
                        }
                      </button>
                    </div>
                  </td>

                  <!-- Plan dropdown -->
                  <td>
                    <select class="plan-select"
                            [value]="user.subscriptionPlan"
                            (click)="$event.stopPropagation()"
                            (change)="onPlanChange(user, $event)"
                            [disabled]="busy === user.userId">
                      <option value="FREE">Free</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </td>

                  <!-- Status -->
                  <td>
                    <span class="status-pill" [class.active]="user.isActive" [class.suspended]="!user.isActive">
                      {{ user.isActive ? 'Active' : 'Suspended' }}
                    </span>
                  </td>

                  <!-- Joined -->
                  <td class="td-muted">{{ formatDate(user.createdAt) }}</td>

                  <!-- Actions -->
                  <td>
                    <div class="action-btns">
                      @if (user.isActive) {
                        <button class="act-btn warn"
                                (click)="$event.stopPropagation(); openSuspendModal(user)"
                                [disabled]="busy === user.userId"
                                title="Suspend user">🚫</button>
                      } @else {
                        <button class="act-btn ok"
                                (click)="$event.stopPropagation(); reactivate(user)"
                                [disabled]="busy === user.userId"
                                title="Reactivate user">✅</button>
                      }
                      <button class="act-btn danger"
                              (click)="$event.stopPropagation(); confirmDelete(user)"
                              [disabled]="busy === user.userId"
                              title="Delete user permanently">🗑</button>
                    </div>
                  </td>
                </tr>
              }
              @if (filtered.length === 0) {
                <tr><td colspan="7" class="empty-row">No users match your filter.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── SUSPEND MODAL ────────────────────────────────────── -->
      @if (activeModal === 'suspend' && suspendTarget) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="confirm-modal suspend-modal" (click)="$event.stopPropagation()">
            <div class="confirm-icon">🚫</div>
            <h3 class="confirm-title">Suspend Account?</h3>
            <p class="confirm-desc">
              An email will be sent to <strong>{{ suspendTarget.email }}</strong> explaining
              the suspension reason and our Code of Conduct.
            </p>

            <div class="reason-group">
              <label class="reason-label">Suspension Reason <span class="req">*</span></label>
              <div class="reason-presets">
                @for (r of suspendReasons; track r) {
                  <button class="preset-btn" [class.active]="suspendReason === r" (click)="suspendReason = r">
                    {{ r }}
                  </button>
                }
              </div>
              <textarea class="reason-textarea"
                        placeholder="Or enter a custom reason…"
                        [(ngModel)]="suspendReason"
                        rows="3"></textarea>
            </div>

            <div class="confirm-btns">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-suspend"
                      (click)="doSuspend()"
                      [disabled]="!suspendReason.trim()">
                Suspend & Email User
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── ROLE CHANGE MODAL ────────────────────────────────── -->
      @if (activeModal === 'role' && roleTarget) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="confirm-modal" (click)="$event.stopPropagation()">
            <div class="confirm-icon">{{ isAdmin(roleTarget) ? '⬇️' : '⬆️' }}</div>
            <h3 class="confirm-title">
              {{ isAdmin(roleTarget) ? 'Demote to User?' : 'Promote to Admin?' }}
            </h3>
            <p class="confirm-desc">
              @if (isAdmin(roleTarget)) {
                <strong>{{ roleTarget.fullName }}</strong> will lose admin access and become a regular user.
              } @else {
                <strong>{{ roleTarget.fullName }}</strong> will gain full admin access to the platform.
              }
            </p>
            <div class="confirm-btns">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-role" (click)="doRoleChange()">
                {{ isAdmin(roleTarget) ? 'Demote' : 'Promote to Admin' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── DELETE MODAL ─────────────────────────────────────── -->
      @if (activeModal === 'delete' && deleteTarget) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="confirm-modal" (click)="$event.stopPropagation()">
            <div class="confirm-icon">⚠️</div>
            <h3 class="confirm-title">Delete User?</h3>
            <p class="confirm-desc">
              This will permanently delete <strong>{{ deleteTarget.fullName }}</strong> and all their data.
              This cannot be undone.
            </p>
            <div class="confirm-btns">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-delete" (click)="doDelete()">Delete permanently</button>
            </div>
          </div>
        </div>
      }

      <!-- ── USER DETAIL MODAL ────────────────────────────────── -->
      @if (activeModal === 'detail' && detailTarget) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="detail-modal" (click)="$event.stopPropagation()">
            <div class="detail-header">
              <div class="detail-user">
                <div class="detail-av" [class.av-admin]="isAdmin(detailTarget)">
                  {{ detailTarget.fullName.charAt(0) }}
                </div>
                <div>
                  <h3 class="detail-title">{{ detailTarget.fullName }}</h3>
                  <p class="detail-sub">{{ detailTarget.email }} · &#64;{{ detailTarget.username }}</p>
                </div>
              </div>
              <button class="close-modal-btn" (click)="closeModal()">×</button>
            </div>

            <div class="detail-body">
              @if (loadingDetail) {
                <div class="skeleton-wrap">
                  <div class="skel-bar"></div>
                  <div class="skel-row"></div>
                  <div class="skel-row" style="width: 80%"></div>
                  <div class="skel-list">
                    <div class="skel-item"></div>
                    <div class="skel-item"></div>
                  </div>
                </div>
              } @else {
                <!-- Stats grid -->
                <div class="detail-stats">
                  <div class="d-stat">
                    <div class="d-stat-val">{{ userResumes.length }}</div>
                    <div class="d-stat-lbl">Resumes</div>
                  </div>
                  <div class="d-stat">
                    <div class="d-stat-val">{{ userAiHistory.length }}</div>
                    <div class="d-stat-lbl">AI Generations</div>
                  </div>
                  <div class="d-stat">
                    <div class="d-stat-val">{{ detailTarget.subscriptionPlan }}</div>
                    <div class="d-stat-lbl">Current Plan</div>
                  </div>
                </div>

                <!-- Account Info -->
                <div class="detail-section">
                  <h4 class="detail-sec-title">Account Information</h4>
                  <div class="detail-info-grid">
                    <div class="di-row">
                      <span class="di-label">Member Since</span>
                      <span class="di-val">{{ formatDate(detailTarget.createdAt) }}</span>
                    </div>
                    @if (detailTarget.subscriptionPlan === 'PREMIUM') {
                      <div class="di-row">
                        <span class="di-label">Premium Expires</span>
                        <span class="di-val text-gold">
                          {{ detailTarget.premiumExpiresAt ? formatDate(detailTarget.premiumExpiresAt) : 'Never' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Resumes List -->
                <div class="detail-section">
                  <h4 class="detail-sec-title">Created Resumes</h4>
                  <div class="detail-list">
                    @for (r of userResumes; track r.resumeId) {
                      <div class="detail-item">
                        <div class="di-icon">📄</div>
                        <div class="di-info">
                          <div class="di-name">{{ r.title || 'Untitled Resume' }}</div>
                          <div class="di-meta">Template: {{ r.templateName || 'Standard' }} · {{ formatDate(r.updatedAt) }}</div>
                        </div>
                      </div>
                    } @empty {
                      <div class="di-empty">No resumes created yet.</div>
                    }
                  </div>
                </div>

                <!-- AI History -->
                <div class="detail-section">
                  <h4 class="detail-sec-title">AI Activity History</h4>
                  <div class="detail-list ai-list">
                    @for (h of userAiHistory.slice(0, 5); track h.id) {
                      <div class="detail-item">
                        <div class="di-icon">🤖</div>
                        <div class="di-info">
                          <div class="di-name">{{ h.actionType || 'Content Generation' }}</div>
                          <div class="di-meta">{{ h.model || 'Gemini Pro' }} · {{ formatDate(h.createdAt) }}</div>
                        </div>
                      </div>
                    } @empty {
                      <div class="di-empty">No AI interactions recorded.</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Toast -->
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
    .header-controls { display: flex; align-items: center; gap: 12px; }
    .search-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.8); padding: 8px 14px; font-size: 0.82rem; min-width: 260px; outline: none; font-family: inherit; }
    .search-input:focus { border-color: rgba(0,212,180,0.4); }

    .date-filters { display: flex; align-items: center; gap: 6px; }
    .date-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.7); padding: 6px 10px; font-size: 0.76rem; font-family: inherit; outline: none; cursor: pointer; }
    .date-input:focus { border-color: rgba(0,212,180,0.4); }
    .date-sep { color: rgba(255,255,255,0.25); font-size: 0.8rem; }

    .filter-bar { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; }
    .filter-btn { padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4); font-size: 0.75rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .filter-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
    .filter-btn.active { background: rgba(0,212,180,0.1); border-color: rgba(0,212,180,0.3); color: #00d4b4; }

    .table-skeletons { display: flex; flex-direction: column; gap: 8px; }
    .row-skeleton { height: 52px; border-radius: 8px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .table-wrap { border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table thead { background: rgba(255,255,255,0.03); }
    .admin-table th { padding: 11px 14px; text-align: left; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.35); border-bottom: 1px solid rgba(255,255,255,0.07); }
    .admin-table td { padding: 13px 14px; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
    .td-muted { color: rgba(255,255,255,0.4); }
    .empty-row { text-align: center; color: rgba(255,255,255,0.25); padding: 32px !important; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-av { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#00d4b4,#00b89c); display: grid; place-items: center; font-size: 0.82rem; font-weight: 700; color: #000; flex-shrink: 0; }
    .user-av.av-admin { background: linear-gradient(135deg,#f59e0b,#d97706); }
    .user-name { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.8); }
    .user-un { font-size: 0.68rem; color: rgba(255,255,255,0.3); }

    .role-cell { display: flex; align-items: center; gap: 6px; }
    .role-pill { font-size: 0.64rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
    .role-pill.role-admin { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
    .role-pill.role-user  { background: rgba(148,163,184,0.1); color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.08); }
    .role-toggle-btn { font-size: 0.7rem; width: 24px; height: 24px; padding: 0; display: grid; place-items: center; color: rgba(255,255,255,0.4); }
    .role-toggle-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }

    .plan-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: rgba(255,255,255,0.75); font-size: 0.76rem; padding: 4px 8px; cursor: pointer; font-family: inherit; outline: none; color-scheme: dark; }
    .plan-select option { background-color: #111520; color: rgba(255,255,255,0.8); }
    .plan-select:focus { border-color: rgba(0,212,180,0.4); }

    .status-pill { font-size: 0.66rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
    .status-pill.active    { background: rgba(0,212,180,0.1); color: #00d4b4; }
    .status-pill.suspended { background: rgba(239,68,68,0.1); color: #f87171; }

    .action-btns { display: flex; gap: 5px; }
    .act-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); cursor: pointer; font-size: 0.8rem; transition: all 0.15s; }
    .act-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .act-btn.warn:hover:not(:disabled)   { background: rgba(234,179,8,0.12); border-color: rgba(234,179,8,0.25); }
    .act-btn.ok:hover:not(:disabled)     { background: rgba(0,212,180,0.12); border-color: rgba(0,212,180,0.25); }
    .act-btn.danger:hover:not(:disabled) { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.25); }

    /* ── MODALS ── */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .confirm-modal { background: #111520; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px; width: 100%; max-width: 420px; text-align: center; animation: slideUp 0.2s ease; }
    .suspend-modal { max-width: 480px; text-align: left; }
    @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    .confirm-icon  { font-size: 2rem; margin-bottom: 10px; text-align: center; }
    .confirm-title { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0 0 8px; text-align: center; }
    .confirm-desc  { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0 0 20px; line-height: 1.5; text-align: center; }

    /* Reason group */
    .reason-group { margin-bottom: 18px; }
    .reason-label { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 8px; }
    .req { color: #f87171; }
    .reason-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .preset-btn { padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.45); font-size: 0.7rem; cursor: pointer; font-family: inherit; transition: all 0.15s; text-align: left; }
    .preset-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
    .preset-btn.active { background: rgba(234,179,8,0.1); border-color: rgba(234,179,8,0.3); color: #fde68a; }
    .reason-textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.75); font-size: 0.78rem; padding: 10px 12px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; line-height: 1.5; }
    .reason-textarea:focus { border-color: rgba(234,179,8,0.4); }

    /* Modal buttons */
    .confirm-btns { display: flex; gap: 8px; }
    .btn-cancel  { flex: 1; padding: 9px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; font-size: 0.82rem; transition: all 0.15s; }
    .btn-cancel:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
    .btn-delete  { flex: 1; padding: 9px; border-radius: 8px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #f87171; cursor: pointer; font-family: inherit; font-size: 0.82rem; font-weight: 600; transition: all 0.15s; }
    .btn-delete:hover { background: rgba(239,68,68,0.2); }
    .btn-suspend { flex: 1; padding: 9px; border-radius: 8px; background: rgba(234,179,8,0.12); border: 1px solid rgba(234,179,8,0.3); color: #fde68a; cursor: pointer; font-family: inherit; font-size: 0.82rem; font-weight: 600; transition: all 0.15s; }
    .btn-suspend:hover:not(:disabled) { background: rgba(234,179,8,0.2); }
    .btn-suspend:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-role    { flex: 1; padding: 9px; border-radius: 8px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b; cursor: pointer; font-family: inherit; font-size: 0.82rem; font-weight: 600; transition: all 0.15s; }
    .btn-role:hover { background: rgba(245,158,11,0.2); }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; background: rgba(0,212,180,0.12); border: 1px solid rgba(0,212,180,0.3); color: #00d4b4; padding: 10px 18px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; z-index: 2000; animation: slideUp 0.2s ease; }
    .toast.toast-err { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #f87171; }

    /* ── DETAIL MODAL ── */
    .detail-modal { background: #0d1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; width: 100%; max-width: 540px; display: flex; flex-direction: column; max-height: 85vh; overflow: hidden; animation: slideUp 0.2s ease; }
    .detail-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
    .detail-user { display: flex; align-items: center; gap: 14px; }
    .detail-av { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#00d4b4,#00b89c); display: grid; place-items: center; font-size: 1.1rem; font-weight: 700; color: #000; }
    .detail-av.av-admin { background: linear-gradient(135deg,#f59e0b,#d97706); }
    .detail-title { font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 2px; }
    .detail-sub { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin: 0; }
    .close-modal-btn { background: none; border: none; font-size: 1.5rem; color: rgba(255,255,255,0.3); cursor: pointer; padding: 0; width: 30px; height: 30px; }
    .close-modal-btn:hover { color: #fff; }

    .detail-body { padding: 24px; overflow-y: auto; flex: 1; }
    
    /* Skeleton Shimmer */
    .skeleton-wrap { padding: 20px; }
    .skel-bar { height: 60px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 20px; position: relative; overflow: hidden; }
    .skel-row { height: 14px; background: rgba(255,255,255,0.03); border-radius: 4px; margin-bottom: 12px; position: relative; overflow: hidden; }
    .skel-list { margin-top: 30px; }
    .skel-item { height: 50px; background: rgba(255,255,255,0.02); border-radius: 10px; margin-bottom: 10px; position: relative; overflow: hidden; }
    .skel-bar::after, .skel-row::after, .skel-item::after {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
      transform: translateX(-100%); animation: shimmer-wave 1.5s infinite;
    }
    @keyframes shimmer-wave { 100% { transform: translateX(100%); } }

    .detail-stats { display: flex; gap: 12px; margin-bottom: 24px; }
    .d-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 14px; border-radius: 12px; text-align: center; }
    .d-stat-val { font-size: 1.2rem; font-weight: 800; color: #fff; }
    .d-stat-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-top: 2px; }

    .detail-section { margin-bottom: 24px; }
    .detail-sec-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 8px; }
    .detail-list { display: flex; flex-direction: column; gap: 8px; }
    .detail-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; }
    .di-icon { font-size: 1.1rem; }
    .di-name { font-size: 0.82rem; color: rgba(255,255,255,0.8); font-weight: 600; margin-bottom: 2px; }
    .di-meta { font-size: 0.68rem; color: rgba(255,255,255,0.3); }
    .di-empty { text-align: center; font-size: 0.78rem; color: rgba(255,255,255,0.2); padding: 12px; }

    .ai-list .detail-item { border-left: 3px solid #8b5cf6; }

    .detail-info-grid { display: flex; flex-direction: column; gap: 10px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); }
    .di-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; }
    .di-label { color: rgba(255,255,255,0.35); }
    .di-val { color: rgba(255,255,255,0.8); font-weight: 600; }
    .text-gold { color: #f59e0b !important; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  users: AdminUser[] = [];
  filtered: AdminUser[] = [];
  loading = true;
  busy: number | null = null;
  toast: string = '';
  toastErr = false;
  searchQuery = '';
  activeFilter = 'ALL';
  dateFrom = '';
  dateTo = '';

  // Modal state
  activeModal: ModalType = null;
  deleteTarget: AdminUser | null = null;
  suspendTarget: AdminUser | null = null;
  roleTarget: AdminUser | null = null;
  detailTarget: AdminUser | null = null;
  suspendReason = '';

  loadingDetail = false;
  userResumes: any[] = [];
  userAiHistory: any[] = [];

  readonly suspendReasons = [
    'Misuse of AI generation features for spam or harmful content',
    'Attempting to bypass rate limits or quota restrictions',
    'Sharing other users\' private resume data without consent',
    'Using the platform for fraudulent job applications',
    'Repeated violations of our Terms of Service',
  ];

  readonly filters = [
    { key: 'ALL', label: 'All Users' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'FREE', label: 'Free Plan' },
    { key: 'PREMIUM', label: 'Premium' },
    { key: 'ADMIN', label: 'Admins' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminApi.getAllUsers().subscribe({
      next: u => { this.users = u; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    let list = [...this.users];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    }
    switch (this.activeFilter) {
      case 'ACTIVE': list = list.filter(u => u.isActive); break;
      case 'SUSPENDED': list = list.filter(u => !u.isActive); break;
      case 'FREE': list = list.filter(u => u.subscriptionPlan === 'FREE'); break;
      case 'PREMIUM': list = list.filter(u => u.subscriptionPlan === 'PREMIUM'); break;
      case 'ADMIN': list = list.filter(u => this.isAdmin(u)); break;
    }

    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      list = list.filter(u => new Date(u.createdAt).getTime() >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo).getTime() + 86_400_000;
      list = list.filter(u => new Date(u.createdAt).getTime() <= to);
    }

    this.filtered = list;
  }

  setFilter(key: string): void { this.activeFilter = key; this.applyFilter(); }

  isAdmin(user: AdminUser): boolean {
    return Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN');
  }

  // ── Plan change ───────────────────────────────────────────────────────────

  onPlanChange(user: AdminUser, event: Event): void {
    const plan = (event.target as HTMLSelectElement).value as 'FREE' | 'PREMIUM';
    this.busy = user.userId;
    this.adminApi.updateSubscription(user.userId, plan).subscribe({
      next: () => { user.subscriptionPlan = plan; this.busy = null; this.showToast(`${user.fullName} → ${plan}`); },
      error: () => { this.busy = null; this.showToast('Failed to update plan', true); }
    });
  }

  // ── Suspend modal ─────────────────────────────────────────────────────────

  openSuspendModal(user: AdminUser): void {
    this.suspendTarget = user;
    this.suspendReason = '';
    this.activeModal = 'suspend';
  }

  doSuspend(): void {
    if (!this.suspendTarget || !this.suspendReason.trim()) return;
    const u = this.suspendTarget;
    this.closeModal();
    this.busy = u.userId;
    this.adminApi.suspendUser(u.userId, this.suspendReason).subscribe({
      next: () => {
        u.isActive = false;
        this.busy = null;
        this.applyFilter();
        this.showToast(`${u.fullName} suspended — suspension email sent`);
      },
      error: () => { this.busy = null; this.showToast('Failed to suspend user', true); }
    });
  }

  // ── Reactivate ────────────────────────────────────────────────────────────

  reactivate(user: AdminUser): void {
    this.busy = user.userId;
    this.adminApi.reactivateUser(user.userId).subscribe({
      next: () => {
        user.isActive = true;
        this.busy = null;
        this.applyFilter();
        this.showToast(`${user.fullName} reactivated — reactivation email sent`);
      },
      error: () => { this.busy = null; this.showToast('Failed to reactivate', true); }
    });
  }

  // ── Role change modal ─────────────────────────────────────────────────────

  confirmRoleChange(user: AdminUser): void {
    this.roleTarget = user;
    this.activeModal = 'role';
  }

  doRoleChange(): void {
    if (!this.roleTarget) return;
    const u = this.roleTarget;
    const newRole: 'ROLE_USER' | 'ROLE_ADMIN' = this.isAdmin(u) ? 'ROLE_USER' : 'ROLE_ADMIN';
    this.closeModal();
    this.busy = u.userId;
    this.adminApi.updateUserRole(u.userId, newRole).subscribe({
      next: () => {
        // Update local roles array
        u.roles = [newRole];
        this.busy = null;
        this.applyFilter();
        const label = newRole === 'ROLE_ADMIN' ? 'promoted to Admin' : 'demoted to User';
        this.showToast(`${u.fullName} ${label}`);
      },
      error: () => { this.busy = null; this.showToast('Failed to change role', true); }
    });
  }

  // ── Delete modal ──────────────────────────────────────────────────────────

  confirmDelete(user: AdminUser): void {
    this.deleteTarget = user;
    this.activeModal = 'delete';
  }

  doDelete(): void {
    if (!this.deleteTarget) return;
    const u = this.deleteTarget;
    this.closeModal();
    this.busy = u.userId;
    this.adminApi.deleteUser(u.userId).subscribe({
      next: () => {
        this.users = this.users.filter(x => x.userId !== u.userId);
        this.applyFilter();
        this.busy = null;
        this.showToast(`${u.fullName} deleted permanently`);
      },
      error: () => { this.busy = null; this.showToast('Failed to delete', true); }
    });
  }

  // ── User Detail ──────────────────────────────────────────────────────────

  openDetail(user: AdminUser): void {
    this.detailTarget = user;
    this.activeModal = 'detail';
    this.loadingDetail = true;
    this.userResumes = [];
    this.userAiHistory = [];

    // Parallel fetch for resumes and AI history
    this.adminApi.getUserResumes(user.userId).subscribe({
      next: r => { this.userResumes = r; this.checkLoading(); },
      error: () => this.checkLoading()
    });

    this.adminApi.getUserAiHistory(user.userId).subscribe({
      next: h => { this.userAiHistory = h; this.checkLoading(); },
      error: () => this.checkLoading()
    });
  }

  private checkLoading(): void {
    // Both calls are async, we stop loading after both attempts (success or fail)
    // For simplicity, we just check if we have data or if time passed
    setTimeout(() => this.loadingDetail = false, 300);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  closeModal(): void {
    this.activeModal = null;
    this.deleteTarget = null;
    this.suspendTarget = null;
    this.roleTarget = null;
    this.detailTarget = null;
    this.suspendReason = '';
  }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  }

  private showToast(msg: string, err = false): void {
    this.toast = msg; this.toastErr = err;
    setTimeout(() => this.toast = '', 3500);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';

export interface AdminUser {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  subscriptionPlan: 'FREE' | 'PREMIUM';
  roles: string[];
  isActive: boolean;
  createdAt: string;
  premiumExpiresAt?: string;
}

export interface AdminTemplate {
  templateId: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  htmlLayout: string;
  cssStyles: string;
  category: string;
  tier: 'FREE' | 'PREMIUM';
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalResumes: number;
  totalExports: number;
  exportsByFormat: Record<string, number>;
  totalAiCalls: number;
  mostUsedTemplates: { templateId: number; name: string; usageCount: number }[];
}

export interface AiUsageStats {
  totalAiCalls: number;
  totalTokensUsed: number; // Keep for fallback, will be 0
  totalCostEstimate: number; // Keep for fallback, will be 0
  callsByModel: Record<string, number>;
  topUsersByUsage: { userId: string; username: string; callCount: number }[];
  dailyTrend?: { date: string; count: number }[];
}

export interface UserDetailStats {
  resumes: any[];
  aiHistory: any[];
  totalResumes: number;
  totalAiCalls: number;
}

export interface TemplateCreateRequest {
  name: string;
  description: string;
  htmlLayout: string;
  cssStyles: string;
  category: string;
  tier: 'FREE' | 'PREMIUM';
  thumbnailUrl?: string;
  isActive?: boolean;
}

const ADMIN_BASE = `${API_BASE}/admin`;

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);

  // ── User Management ──────────────────────────────────────────────────────

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${ADMIN_BASE}/users`);
  }

  /** Suspend a user - sends suspension email with Code of Conduct + reason */
  suspendUser(userId: number, reason?: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${ADMIN_BASE}/users/${userId}/suspend`,
      { reason: reason || 'Violation of ResumeAI platform Terms of Service and Code of Conduct.' }
    );
  }

  /** Reactivate a suspended user - sends reactivation email */
  reactivateUser(userId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${ADMIN_BASE}/users/${userId}/reactivate`, {});
  }

  /** Change subscription plan: FREE or PREMIUM */
  updateSubscription(userId: number, plan: 'FREE' | 'PREMIUM'): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${ADMIN_BASE}/users/${userId}/subscription`,
      { plan }
    );
  }

  /** Change user role: ROLE_USER or ROLE_ADMIN */
  updateUserRole(userId: number, role: 'ROLE_USER' | 'ROLE_ADMIN'): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${ADMIN_BASE}/users/${userId}/role`,
      { role }
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${ADMIN_BASE}/users/${userId}`);
  }

  // ── Template Management ──────────────────────────────────────────────────

  getAllTemplates(): Observable<AdminTemplate[]> {
    return this.http.get<AdminTemplate[]>(`${API_BASE}/templates/admin`);
  }

  createTemplate(payload: TemplateCreateRequest): Observable<AdminTemplate> {
    return this.http.post<AdminTemplate>(`${API_BASE}/templates`, payload);
  }

  updateTemplate(id: number, payload: Partial<TemplateCreateRequest>): Observable<AdminTemplate> {
    return this.http.put<AdminTemplate>(`${API_BASE}/templates/${id}`, payload);
  }

  /** Deactivate (soft-delete) a template */
  deactivateTemplate(id: number): Observable<void> {
    return this.http.put<void>(`${API_BASE}/templates/${id}/deactivate`, {});
  }

  /** Re-activate a previously deactivated template by updating it */
  activateTemplate(id: number): Observable<AdminTemplate> {
    return this.http.put<AdminTemplate>(`${API_BASE}/templates/${id}`, { isActive: true });
  }

  /** Permanently delete a template */
  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/templates/${id}`);
  }

  /** Extract template HTML/CSS and Thumbnail from an uploaded PDF resume */
  extractTemplateFromPdf(file: File): Observable<{ thumbnailUrl: string, htmlLayout: string, cssStyles: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ thumbnailUrl: string, htmlLayout: string, cssStyles: string }>(`${API_BASE}/ai/templates/extract-from-pdf`, formData);
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  getPlatformAnalytics(): Observable<PlatformAnalytics> {
    return this.http.get<PlatformAnalytics>(`${API_BASE}/resumes/admin/stats`);
  }

  getAiUsageStats(): Observable<AiUsageStats> {
    return this.http.get<AiUsageStats>(`${API_BASE}/ai/admin/usage-stats`);
  }

  getExportAdminStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${API_BASE}/exports/admin/stats`);
  }

  // ── Resume Management ────────────────────────────────────────────────────

  getAllResumes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/resumes/admin/all`);
  }

  deleteResume(resumeId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/resumes/admin/${resumeId}`);
  }

  // ── Broadcast Notifications ──────────────────────────────────────────────

  sendBroadcastToAll(title: string, message: string): Observable<void> {
    return this.http.post<void>(`${API_BASE}/notifications/send-bulk`, {
      title, message, tier: 'ALL'
    });
  }

  sendBroadcastByPlan(plan: 'FREE' | 'PREMIUM', title: string, message: string): Observable<void> {
    return this.http.post<void>(`${API_BASE}/notifications/send-bulk`, {
      title, message, tier: plan
    });
  }

  // ── Audit Logs ───────────────────────────────────────────────────────────

  getAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${ADMIN_BASE}/audit-logs`);
  }


  // ── User Detailed History ────────────────────────────────────────────────

  getUserResumes(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/resumes/user/${userId}`);
  }

  getUserAiHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/ai/history/${userId}`);
  }
}

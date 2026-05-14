import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminApiService, AdminUser, AdminTemplate, TemplateCreateRequest, PlatformAnalytics, AiUsageStats } from './admin-api.service';
import { API_BASE } from '../../../core/config/api.config';

describe('AdminApiService', () => {
  let service: AdminApiService;
  let httpMock: HttpTestingController;
  const ADMIN_BASE = `${API_BASE}/admin`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminApiService]
    });
    service = TestBed.inject(AdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('User Management', () => {
    it('should fetch all users', () => {
      const mockUsers: AdminUser[] = [
        { userId: 1, username: 'user1', email: 'u1@e.com', subscriptionPlan: 'FREE', roles: ['ROLE_USER'], isActive: true, createdAt: '', fullName: 'U1', mobileNumber: '123' }
      ];

      service.getAllUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should suspend a user with default reason', () => {
      service.suspendUser(1).subscribe(res => {
        expect(res.message).toBe('Suspended');
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users/1/suspend`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.reason).toContain('Violation of ResumeAI platform');
      req.flush({ message: 'Suspended' });
    });

    it('should suspend a user with custom reason', () => {
      service.suspendUser(1, 'Spamming').subscribe(res => {
        expect(res.message).toBe('Suspended');
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users/1/suspend`);
      expect(req.request.body.reason).toBe('Spamming');
      req.flush({ message: 'Suspended' });
    });

    it('should reactivate a user', () => {
      service.reactivateUser(1).subscribe(res => {
        expect(res.message).toBe('Reactivated');
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users/1/reactivate`);
      expect(req.request.method).toBe('PUT');
      req.flush({ message: 'Reactivated' });
    });

    it('should update subscription', () => {
      service.updateSubscription(1, 'PREMIUM').subscribe(res => {
        expect(res.message).toBe('Updated');
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users/1/subscription`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.plan).toBe('PREMIUM');
      req.flush({ message: 'Updated' });
    });

    it('should update user role', () => {
      service.updateUserRole(1, 'ROLE_ADMIN').subscribe(res => {
        expect(res.message).toBe('Updated');
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users/1/role`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.role).toBe('ROLE_ADMIN');
      req.flush({ message: 'Updated' });
    });

    it('should delete user', () => {
      service.deleteUser(1).subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${ADMIN_BASE}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Template Management', () => {
    it('should fetch all admin templates', () => {
      service.getAllTemplates().subscribe(res => {
        expect(Array.isArray(res)).toBeTrue();
      });
      const req = httpMock.expectOne(`${API_BASE}/templates/admin`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should create template', () => {
      const payload: TemplateCreateRequest = { name: 'T1', description: 'D1', htmlLayout: 'H1', cssStyles: 'C1', category: 'C1', tier: 'FREE' };
      const mockT: AdminTemplate = { ...payload, templateId: 1, thumbnailUrl: '', isActive: true, usageCount: 0, createdAt: '' };
      service.createTemplate(payload).subscribe(res => {
        expect(res).toEqual(mockT);
      });

      const req = httpMock.expectOne(`${API_BASE}/templates`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockT);
    });

    it('should update template', () => {
      service.updateTemplate(1, { name: 'New Name' }).subscribe(res => {
        expect(res).toBeTruthy();
      });
      const req = httpMock.expectOne(`${API_BASE}/templates/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.name).toBe('New Name');
      req.flush({ templateId: 1, name: 'New Name' });
    });

    it('should deactivate template', () => {
      service.deactivateTemplate(1).subscribe(res => {
        expect(res).toBeNull();
      });
      const req = httpMock.expectOne(`${API_BASE}/templates/1/deactivate`);
      expect(req.request.method).toBe('PUT');
      req.flush(null);
    });

    it('should activate template', () => {
      const mockT: AdminTemplate = { templateId: 1, name: 'T', description: '', thumbnailUrl: '', htmlLayout: '', cssStyles: '', category: '', tier: 'FREE', isActive: true, usageCount: 0, createdAt: '' };
      service.activateTemplate(1).subscribe(res => {
        expect(res).toEqual(mockT);
      });
      const req = httpMock.expectOne(`${API_BASE}/templates/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.isActive).toBe(true);
      req.flush(mockT);
    });

    it('should extract template from pdf', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const mockRes = { thumbnailUrl: 't', htmlLayout: 'h', cssStyles: 'c' };
      service.extractTemplateFromPdf(file).subscribe(res => {
        expect(res).toEqual(mockRes);
      });

      const req = httpMock.expectOne(`${API_BASE}/ai/templates/extract-from-pdf`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockRes);
    });
  });

  describe('Analytics & Stats', () => {
    it('should fetch platform analytics', () => {
      const mockAnalytics: PlatformAnalytics = {
        totalUsers: 100, activeUsers: 50, premiumUsers: 10, totalResumes: 200,
        totalExports: 300, exportsByFormat: { PDF: 300 }, totalAiCalls: 500,
        mostUsedTemplates: []
      };
      service.getPlatformAnalytics().subscribe(res => {
        expect(res).toEqual(mockAnalytics);
      });
      const req = httpMock.expectOne(`${API_BASE}/resumes/admin/stats`);
      req.flush(mockAnalytics);
    });

    it('should fetch ai usage stats', () => {
      const mockStats: AiUsageStats = {
        totalAiCalls: 100, totalTokensUsed: 0, totalCostEstimate: 0,
        callsByModel: { 'gpt-4': 100 }, topUsersByUsage: []
      };
      service.getAiUsageStats().subscribe(res => {
        expect(res).toEqual(mockStats);
      });
      const req = httpMock.expectOne(`${API_BASE}/ai/admin/usage-stats`);
      req.flush(mockStats);
    });

    it('should fetch export admin stats', () => {
      const mockStats = { PDF: 100 };
      service.getExportAdminStats().subscribe(res => {
        expect(res).toEqual(mockStats);
      });
      const req = httpMock.expectOne(`${API_BASE}/exports/admin/stats`);
      req.flush(mockStats);
    });
  });

  describe('Resume Management', () => {
    it('should fetch all resumes', () => {
      service.getAllResumes().subscribe(res => {
        expect(Array.isArray(res)).toBeTrue();
      });
      const req = httpMock.expectOne(`${API_BASE}/resumes/admin/all`);
      req.flush([]);
    });

    it('should delete resume', () => {
      service.deleteResume(1).subscribe(res => {
        expect(res).toBeNull();
      });
      const req = httpMock.expectOne(`${API_BASE}/resumes/admin/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Broadcast & Audits', () => {
    it('should send broadcast to all', () => {
      service.sendBroadcastToAll('T', 'M').subscribe(res => {
        expect(res).toBeNull();
      });
      const req = httpMock.expectOne(`${API_BASE}/notifications/send-bulk`);
      expect(req.request.body.tier).toBe('ALL');
      req.flush(null);
    });

    it('should send broadcast by plan', () => {
      service.sendBroadcastByPlan('PREMIUM', 'T', 'M').subscribe(res => {
        expect(res).toBeNull();
      });
      const req = httpMock.expectOne(`${API_BASE}/notifications/send-bulk`);
      expect(req.request.body.tier).toBe('PREMIUM');
      req.flush(null);
    });

    it('should fetch audit logs', () => {
      service.getAuditLogs().subscribe(res => {
        expect(Array.isArray(res)).toBeTrue();
      });
      const req = httpMock.expectOne(`${ADMIN_BASE}/audit-logs`);
      req.flush([]);
    });

    it('should fetch user resumes', () => {
      service.getUserResumes(1).subscribe(res => {
        expect(Array.isArray(res)).toBeTrue();
      });
      const req = httpMock.expectOne(`${API_BASE}/resumes/user/1`);
      req.flush([]);
    });

    it('should fetch user ai history', () => {
      service.getUserAiHistory(1).subscribe(res => {
        expect(Array.isArray(res)).toBeTrue();
      });
      const req = httpMock.expectOne(`${API_BASE}/ai/history/1`);
      req.flush([]);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminApiService } from '../services/admin-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let mockAdminApi: any;
  let mockAuthService: any;
  let router: Router;
  let urlSpy: jasmine.Spy;

  const analyticsData = {
    totalUsers: 100, activeUsers: 50, premiumUsers: 10,
    totalResumes: 200, totalAiCalls: 500, totalExports: 300,
    exportsByFormat: { PDF: 200, DOCX: 100 },
    mostUsedTemplates: [{ templateId: 1, name: 'T1', usageCount: 50 }]
  };

  const aiStatsData = {
    totalCostEstimate: 5.50, totalTokensUsed: 10000
  };

  beforeEach(async () => {
    mockAdminApi = {
      getPlatformAnalytics: jasmine.createSpy('getPlatformAnalytics').and.returnValue(of(analyticsData)),
      getAiUsageStats: jasmine.createSpy('getAiUsageStats').and.returnValue(of(aiStatsData))
    };

    mockAuthService = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ fullName: 'Admin User' }),
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, RouterTestingModule],
      providers: [
        { provide: AdminApiService, useValue: mockAdminApi },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    // Create spy once — each test will set return value before init
    urlSpy = spyOnProperty(router, 'url', 'get').and.returnValue('/admin');

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load stats if on root route', () => {
    expect(component).toBeTruthy();
    expect(component.isDashboardRoot).toBeTrue();
    expect(mockAdminApi.getPlatformAnalytics).toHaveBeenCalled();
    expect(mockAdminApi.getAiUsageStats).toHaveBeenCalled();
    expect(component.analytics?.totalUsers).toBe(100);
    expect(component.aiStats?.totalCostEstimate).toBe(5.50);
    expect(component.loading).toBeFalse();
  });

  it('should not load stats if not on root route', () => {
    urlSpy.and.returnValue('/admin/users');

    component.analytics = null;
    component.loading = true;
    component.ngOnInit();

    expect(component.isDashboardRoot).toBeFalse();
    expect(component.loading).toBeFalse();
    // analytics should remain null since we didn't fetch
    expect(component.analytics).toBeNull();
  });

  it('should handle analytics load error', () => {
    urlSpy.and.returnValue('/admin');
    mockAdminApi.getPlatformAnalytics.and.returnValue(throwError(() => new Error('error')));
    component.analytics = null;
    component.loading = true;
    component.ngOnInit();

    expect(component.analytics).toBeNull();
    expect(component.loading).toBeFalse();
  });

  it('should handle AI stats load error', () => {
    urlSpy.and.returnValue('/admin');
    mockAdminApi.getAiUsageStats.and.returnValue(throwError(() => new Error('error')));
    component.aiStats = null;
    component.ngOnInit();

    expect(component.aiStats).toBeNull();
  });

  it('should get admin name and initial correctly', () => {
    expect(component.adminName).toBe('Admin User');
    expect(component.adminInitial).toBe('A');

    mockAuthService.currentUser.and.returnValue(null);
    expect(component.adminName).toBe('Admin');
    expect(component.adminInitial).toBe('A');
  });

  it('should call auth service logout', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});

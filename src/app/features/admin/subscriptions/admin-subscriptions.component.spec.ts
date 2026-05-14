import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSubscriptionsComponent } from './admin-subscriptions.component';
import { AdminPaymentService } from '../../../core/services/admin-payment.service';
import { of, throwError } from 'rxjs';

describe('AdminSubscriptionsComponent', () => {
  let component: AdminSubscriptionsComponent;
  let fixture: ComponentFixture<AdminSubscriptionsComponent>;
  let mockAdminPayment: any;

  const mockStats = {
    totalRevenueInPaise: 50000,
    totalActiveSubscriptions: 10,
    totalExpiredSubscriptions: 0,
    totalCancelledSubscriptions: 2,
    planDistribution: { 'MONTHLY': 8, 'YEARLY': 2 }
  };

  const mockSubs = {
    content: [
      { id: 1, fullName: 'John Doe', username: 'john', plan: 'PREMIUM', status: 'ACTIVE', startDate: '2024-01-01' }
    ],
    totalElements: 1
  };

  beforeEach(async () => {
    mockAdminPayment = {
      getStats: jasmine.createSpy('getStats').and.returnValue(of(mockStats)),
      getSubscriptions: jasmine.createSpy('getSubscriptions').and.returnValue(of(mockSubs))
    };

    await TestBed.configureTestingModule({
      imports: [AdminSubscriptionsComponent],
      providers: [
        { provide: AdminPaymentService, useValue: mockAdminPayment }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSubscriptionsComponent);
    component = fixture.componentInstance;
  });

  it('should create and load data on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockAdminPayment.getStats).toHaveBeenCalled();
    expect(mockAdminPayment.getSubscriptions).toHaveBeenCalled();
    expect(component.stats).toEqual(mockStats);
    expect(component.subscriptions.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle getSubscriptions error', () => {
    mockAdminPayment.getSubscriptions.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(component.subscriptions.length).toBe(0);
  });
});

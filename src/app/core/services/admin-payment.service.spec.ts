import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminPaymentService, SubscriptionStats } from './admin-payment.service';
import { API_BASE } from '../config/api.config';

describe('AdminPaymentService', () => {
  let service: AdminPaymentService;
  let httpMock: HttpTestingController;
  const adminApi = `${API_BASE}/admin/subscriptions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminPaymentService]
    });
    service = TestBed.inject(AdminPaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch subscriptions with default page/size', () => {
    service.getSubscriptions().subscribe();
    const req = httpMock.expectOne(`${adminApi}?page=0&size=20`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [] });
  });

  it('should fetch subscriptions with custom page/size', () => {
    const mockData = { content: [{ id: 1 }], totalElements: 1 };
    service.getSubscriptions(2, 50).subscribe(res => {
      expect(res).toEqual(mockData);
    });
    const req = httpMock.expectOne(`${adminApi}?page=2&size=50`);
    req.flush(mockData);
  });

  it('should fetch subscription stats', () => {
    const mockStats: SubscriptionStats = {
      totalActiveSubscriptions: 10,
      totalExpiredSubscriptions: 5,
      totalCancelledSubscriptions: 2,
      totalRevenueInPaise: 100000,
      planDistribution: { 'MONTHLY': 8, 'YEARLY': 2 }
    };

    service.getStats().subscribe(stats => {
      expect(stats).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${adminApi}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should handle getStats error', () => {
    service.getStats().subscribe({
      error: (err) => expect(err).toBeTruthy()
    });
    const req = httpMock.expectOne(`${adminApi}/stats`);
    req.error(new ProgressEvent('Server Error'));
  });
});

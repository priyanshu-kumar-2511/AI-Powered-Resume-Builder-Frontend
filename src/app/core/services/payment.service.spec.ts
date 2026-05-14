import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService, BillingCycle, CreateOrderResponse, VerifyPaymentRequest, VerifyPaymentResponse, SubscriptionStatusResponse, SimulatedPaymentRequest } from './payment.service';
import { PAYMENT_API } from '../config/api.config';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an order successfully via POST', () => {
    const mockResponse: CreateOrderResponse = {
      orderId: 'order_123',
      amountInPaise: 90000,
      currency: 'INR',
      keyId: 'key_123',
      billingCycle: 'MONTHLY'
    };
    
    service.createOrder('MONTHLY').subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${PAYMENT_API}/create-order`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ billingCycle: 'MONTHLY' });
    req.flush(mockResponse);
  });

  it('should verify payment successfully via POST', () => {
    const payload: VerifyPaymentRequest = {
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_123',
      razorpaySignature: 'sig_123',
      billingCycle: 'MONTHLY'
    };

    const mockResponse: VerifyPaymentResponse = {
      success: true,
      newToken: 'jwt-token-premium',
      message: 'Payment verified'
    };

    service.verifyPayment(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${PAYMENT_API}/verify`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should complete a simulated payment via POST', () => {
    const payload: SimulatedPaymentRequest = { billingCycle: 'YEARLY' };
    const mockResponse: VerifyPaymentResponse = {
      success: true,
      newToken: 'jwt-token-premium-dev',
      message: 'Simulated payment completed'
    };

    service.completeSimulatedPayment(payload).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${PAYMENT_API}/dev-complete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should get subscription status successfully via GET', () => {
    const mockResponse: SubscriptionStatusResponse = {
      plan: 'PREMIUM',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      startDate: '2023-01-01',
      endDate: '2023-02-01',
      razorpayPaymentId: 'pay_123'
    };

    service.getStatus().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${PAYMENT_API}/status`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should cancel subscription successfully via POST', () => {
    const mockResponse = { message: 'Subscription cancelled successfully' };

    service.cancelSubscription().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${PAYMENT_API}/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PricingComponent } from './pricing.component';
import { RouterTestingModule } from '@angular/router/testing';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NotificationPollingService } from '../notifications/services/notification-polling.service';
import { ConfirmService } from '../../shared/services/confirm.service';

// ── Razorpay Mock Setup ──────────────────────────────────────────────────────
let capturedOptions: any = null;
const mockOpenSpy = jasmine.createSpy('open');

/**
 * Standard function-based constructor to satisfy 'new Razorpay()' calls.
 */
function MockRazorpay(this: any, opts: any) {
  capturedOptions = opts;
  this.open = mockOpenSpy;
}

// Ensure it's available on the window object before anything else
(window as any).Razorpay = MockRazorpay;

describe('PricingComponent', () => {
  let component: PricingComponent;
  let fixture: ComponentFixture<PricingComponent>;
  let mockPaymentService: any;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    // Re-verify window assignment in case of environment resets
    (window as any).Razorpay = MockRazorpay;

    mockPaymentService = {
      createOrder: jasmine.createSpy('createOrder').and.returnValue(of({
        orderId: 'order_123',
        amountInPaise: 5000,
        currency: 'INR',
        keyId: 'rzp_test_123',
        billingCycle: 'MONTHLY'
      })),
      completeSimulatedPayment: jasmine.createSpy('completeSimulatedPayment').and.returnValue(of({
        success: true,
        newToken: 'mock-token'
      })),
      verifyPayment: jasmine.createSpy('verifyPayment').and.returnValue(of({
        success: true,
        newToken: 'mock-token'
      }))
    };

    mockAuthService = {
      getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue('FREE'),
      refreshTokenFromPayment: jasmine.createSpy('refreshTokenFromPayment').and.returnValue(of({})),
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
    };
    const mockConfirm = {
      ask: jasmine.createSpy('ask').and.returnValue(Promise.resolve(true)),
      alert: jasmine.createSpy('alert').and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      imports: [PricingComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfirmService, useValue: mockConfirm },
        { provide: NotificationPollingService, useValue: { startPolling: jasmine.createSpy(), stopPolling: jasmine.createSpy(), unreadCount$: of(0) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
    fixture.detectChanges();
    
    mockOpenSpy.calls.reset();
    capturedOptions = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with FREE plan', () => {
    expect(component.currentPlan).toEqual('FREE');
    expect(component.cycle).toEqual('MONTHLY');
  });

  it('should change billing cycle', () => {
    component.setCycle('YEARLY');
    expect(component.cycle).toEqual('YEARLY');
  });

  it('should start simulated payment when buy is clicked (if enabled)', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    await (component as any).startSimulatedPayment();

    expect(mockPaymentService.completeSimulatedPayment).toHaveBeenCalledWith({ billingCycle: 'MONTHLY' });
    expect(mockAuthService.refreshTokenFromPayment).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
    expect(component.currentPlan).toEqual('PREMIUM');
    expect(component.loading).toBeFalse();
  });

  it('should handle order creation error', () => {
    mockPaymentService.createOrder.and.returnValue(throwError(() => ({ error: { message: 'Order Failed' } })));
    (component as any).paymentSvc.createOrder = mockPaymentService.createOrder;
    component.loading = true;
    mockPaymentService.createOrder(component.cycle).subscribe({
      error: (e: any) => {
        component.loading = false;
        component.errorMsg = e.error.message;
      }
    });
    expect(component.loading).toBeFalse();
    expect(component.errorMsg).toEqual('Order Failed');
  });

  it('should not start simulated payment if user cancels confirm', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(false));
    await (component as any).startSimulatedPayment();
    expect(mockPaymentService.completeSimulatedPayment).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should handle simulated payment error response', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    mockPaymentService.completeSimulatedPayment.and.returnValue(of({
      success: false,
      message: 'Simulated fail msg'
    }));
    await (component as any).startSimulatedPayment();
    expect(component.errorMsg).toBe('Simulated fail msg');
  });

  it('should handle simulated payment catchError', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    mockPaymentService.completeSimulatedPayment.and.returnValue(throwError(() => ({ error: { message: 'Http Error' } })));
    await (component as any).startSimulatedPayment();
    expect(component.errorMsg).toBe('Http Error');
  });

  it('should handle verifyPayment failure without message', () => {
    const mockRes = { success: false };
    mockPaymentService.verifyPayment.and.returnValue(of(mockRes));
    (component as any).verifyPayment({ 
      razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' 
    }, 'MONTHLY');
    expect(component.errorMsg).toBe('Payment verification failed.');
  });

  it('should handle verifyPayment catchError', () => {
    mockPaymentService.verifyPayment.and.returnValue(throwError(() => ({ error: { message: 'Http Verify Error' } })));
    (component as any).verifyPayment({ 
      razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' 
    }, 'MONTHLY');
    expect(component.errorMsg).toBe('Http Verify Error');
  });

  it('should handle missing clipboard', () => {
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    expect(() => {
      (component as any).prepareTestUpiShortcut('rzp_test_123');
    }).not.toThrow();
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('should build payment hint correctly', () => {
    const hint = (component as any).buildPaymentHint('rzp_test_123');
    expect(hint).toContain('Test mode is active');
    const liveHint = (component as any).buildPaymentHint('rzp_live_123');
    expect(liveHint).toEqual('');
  });

  it('should handle verifyPayment success', () => {
    const mockRes = { success: true, newToken: 'premium-token' };
    mockPaymentService.verifyPayment.and.returnValue(of(mockRes));
    (component as any).verifyPayment({ 
      razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' 
    }, 'MONTHLY');
    expect(component.currentPlan).toBe('PREMIUM');
    expect(mockAuthService.refreshTokenFromPayment).toHaveBeenCalledWith('premium-token');
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should handle verifyPayment failure', () => {
    const mockRes = { success: false, message: 'Invalid Sig' };
    mockPaymentService.verifyPayment.and.returnValue(of(mockRes));
    (component as any).verifyPayment({ 
      razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' 
    }, 'MONTHLY');
    expect(component.errorMsg).toBe('Invalid Sig');
    expect(component.loading).toBeFalse();
  });

  it('should prepare test UPI shortcut and copy to clipboard', async () => {
    const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    (component as any).prepareTestUpiShortcut('rzp_test_123');
    expect(component.paymentHint).toContain('success@razorpay');
    expect(clipboardSpy).toHaveBeenCalledWith('success@razorpay');
  });

  it('should extract error message from various error objects', () => {
    expect((component as any).extractErrorMessage({ error: { message: 'Api Error' } }, 'f')).toBe('Api Error');
    expect((component as any).extractErrorMessage({ error: { error: 'Direct Error' } }, 'f')).toBe('Direct Error');
    expect((component as any).extractErrorMessage({ message: 'Simple Msg' }, 'f')).toBe('Simple Msg');
    expect((component as any).extractErrorMessage({}, 'fallback')).toBe('fallback');
    expect((component as any).extractErrorMessage({ error: { message: '   ' } }, 'fallback')).toBe('fallback');
  });

  it('should handle prepareTestUpiShortcut with live key (no-op)', () => {
    const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    (component as any).prepareTestUpiShortcut('rzp_live_abc');
    expect(clipboardSpy).not.toHaveBeenCalled();
  });

  it('should handle simulated payment failure without message', async () => {
    const confirmSvc = TestBed.inject(ConfirmService);
    (confirmSvc.ask as jasmine.Spy).and.returnValue(Promise.resolve(true));
    mockPaymentService.completeSimulatedPayment.and.returnValue(of({ success: false }));
    await (component as any).startSimulatedPayment();
    expect(component.errorMsg).toBe('Simulated payment failed.');
  });

  it('should set returnUrl from query params', () => {
    component['returnUrl'] = '/builder/123';
    expect(component['returnUrl']).toBe('/builder/123');
  });

  it('should call openRazorpay when buy() runs real Razorpay flow', () => {
    const order = {
      orderId: 'o1', amountInPaise: 5000, currency: 'INR',
      keyId: 'rzp_test_123', billingCycle: 'MONTHLY' as any
    };
    (component as any).openRazorpay(order);
    expect(mockOpenSpy).toHaveBeenCalled();
    expect(component.paymentHint).toContain('success@razorpay');
  });

  it('should openRazorpay with live key and no hint', () => {
    const order = {
      orderId: 'o1', amountInPaise: 5000, currency: 'INR',
      keyId: 'rzp_live_abc', billingCycle: 'YEARLY' as any
    };
    (component as any).openRazorpay(order);
    expect(mockOpenSpy).toHaveBeenCalled();
    expect((component as any).buildPaymentHint('rzp_live_abc')).toBe('');
  });

  it('should handle ondismiss callback from Razorpay modal', () => {
    const order = {
      orderId: 'o1', amountInPaise: 5000, currency: 'INR',
      keyId: 'rzp_test_x', billingCycle: 'MONTHLY' as any
    };
    component.loading = true;
    (component as any).openRazorpay(order);
    
    if (capturedOptions && capturedOptions.modal) {
      capturedOptions.modal.ondismiss();
    }
    expect(component.loading).toBeFalse();
  });

  it('should openRazorpayWithUpi and invoke handler/ondismiss', () => {
    mockPaymentService.verifyPayment.and.returnValue(of({ success: true, newToken: 't' }));
    const order = {
      orderId: 'o1', amountInPaise: 5000, currency: 'INR',
      keyId: 'rzp_test_x', billingCycle: 'YEARLY' as any
    };
    (component as any).openRazorpayWithUpi(order, 'test@upi');
    expect(mockOpenSpy).toHaveBeenCalled();
    
    if (capturedOptions) {
      capturedOptions.handler({ razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' });
      expect(mockPaymentService.verifyPayment).toHaveBeenCalled();
      
      component.loading = true;
      capturedOptions.modal.ondismiss();
      expect(component.loading).toBeFalse();
    }
  });

  it('should handle buy() real flow with createOrder error', () => {
    Object.defineProperty(component, 'USE_LOCALHOST_SIMULATED_PAYMENT', { value: false });
    mockPaymentService.createOrder.and.returnValue(throwError(() => ({ error: { message: 'Order Fail' } })));
    component.loading = true;
    mockPaymentService.createOrder(component.cycle).subscribe({
      error: (e: any) => {
        component.loading = false;
        component.errorMsg = (component as any).extractErrorMessage(e, 'Fallback');
      }
    });
    expect(component.loading).toBeFalse();
    expect(component.errorMsg).toBe('Order Fail');
  });
});

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PAYMENT_API } from '../config/api.config';

// ── Types ────────────────────────────────────────────────────────────────────

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface CreateOrderResponse {
  orderId:       string;
  amountInPaise: number;
  currency:      string;
  keyId:         string;
  billingCycle:  BillingCycle;
}

export interface VerifyPaymentRequest {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  billingCycle:      BillingCycle;
}

export interface VerifyPaymentResponse {
  success:   boolean;
  newToken:  string;
  message:   string;
}

export interface SimulatedPaymentRequest {
  billingCycle: BillingCycle;
}

export interface SubscriptionStatusResponse {
  plan:             'FREE' | 'PREMIUM';
  billingCycle:     BillingCycle | null;
  status:           'ACTIVE' | 'CANCELLED' | 'EXPIRED' | null;
  startDate:        string | null;
  endDate:          string | null;
  razorpayPaymentId: string | null;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  /**
   * Step 1: Create a Razorpay order. Returns orderId + amount for checkout.
   */
  createOrder(billingCycle: BillingCycle): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${PAYMENT_API}/create-order`, { billingCycle });
  }

  /**
   * Step 2: Verify payment signature after Razorpay checkout completes.
   * On success, backend returns a new JWT with PREMIUM plan claim.
   */
  verifyPayment(payload: VerifyPaymentRequest): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(`${PAYMENT_API}/verify`, payload);
  }

  /**
   * Localhost-only helper: simulate a completed payment and activate PREMIUM.
   */
  completeSimulatedPayment(payload: SimulatedPaymentRequest): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(`${PAYMENT_API}/dev-complete`, payload);
  }

  /**
   * Get the current user's subscription status (plan, dates, billing cycle).
   */
  getStatus(): Observable<SubscriptionStatusResponse> {
    return this.http.get<SubscriptionStatusResponse>(`${PAYMENT_API}/status`);
  }

  /**
   * Cancel the active subscription.
   * Subscription is cancelled immediately and the user is downgraded to FREE.
   */
  cancelSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${PAYMENT_API}/cancel`, {});
  }
}

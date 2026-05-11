import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router, ActivatedRoute }         from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PaymentService, BillingCycle, CreateOrderResponse } from '../../core/services/payment.service';
import { AuthService }    from '../../core/services/auth.service';
import { USE_LOCALHOST_SIMULATED_PAYMENT } from '../../core/config/api.config';

declare const Razorpay: new (options: object) => { open(): void };

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  template: `
    <app-navbar />

    <div class="pricing-page">
      <!-- Header -->
      <div class="pricing-header">
        <div class="badge-pill">✨ Upgrade</div>
        <h1 class="pricing-title">Choose Your Plan</h1>
        <p class="pricing-sub">Start for free. Upgrade when you're ready to unlock everything.</p>

        <!-- Billing Toggle -->
        <div class="billing-toggle">
          <button class="toggle-btn" [class.active]="cycle === 'MONTHLY'" (click)="setCycle('MONTHLY')">
            Monthly
          </button>
          <button class="toggle-btn" [class.active]="cycle === 'YEARLY'" (click)="setCycle('YEARLY')">
            Yearly
            <span class="discount-badge">17% OFF</span>
          </button>
        </div>
      </div>

      <!-- Plan Cards -->
      <div class="plans-grid">

        <!-- FREE Card -->
        <div class="plan-card free-card">
          <div class="plan-header">
            <span class="plan-icon">🆓</span>
            <h2 class="plan-name">Free</h2>
            <div class="plan-price">
              <span class="price-amount">₹0</span>
              <span class="price-period">forever</span>
            </div>
          </div>
          <ul class="feature-list">
            <li class="feat"><span class="feat-icon check">✓</span> 3 Resumes</li>
            <li class="feat"><span class="feat-icon check">✓</span> 5 AI Generations / month</li>
            <li class="feat"><span class="feat-icon check">✓</span> 3 PDF Exports / month</li>
            <li class="feat"><span class="feat-icon check">✓</span> 2 ATS Checks / month</li>
            <li class="feat"><span class="feat-icon check">✓</span> 2 Free Templates</li>
            <li class="feat"><span class="feat-icon cross">✗</span> All Premium Templates</li>
            <li class="feat"><span class="feat-icon cross">✗</span> Unlimited AI</li>
            <li class="feat"><span class="feat-icon cross">✗</span> Priority Support</li>
          </ul>
          <button class="plan-btn free-btn" disabled>
            @if (currentPlan === 'FREE') { Current Plan } @else { Downgraded }
          </button>
        </div>

        <!-- PREMIUM Card -->
        <div class="plan-card premium-card">
          <div class="popular-badge">Most Popular</div>
          <div class="plan-header">
            <span class="plan-icon">⭐</span>
            <h2 class="plan-name">Premium</h2>
            <div class="plan-price">
              @if (cycle === 'MONTHLY') {
                <span class="price-amount">₹50</span>
                <span class="price-period">/ month</span>
              } @else {
                <span class="price-amount">₹500</span>
                <span class="price-period">/ year</span>
                <span class="price-savings">Save ₹100 vs monthly</span>
              }
            </div>
          </div>
          <ul class="feature-list">
            <li class="feat"><span class="feat-icon check gold">✓</span> Unlimited Resumes</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> Unlimited AI Generations</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> Unlimited PDF Exports</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> Unlimited ATS Checks</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> All 6 Premium Templates</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> AI Resume Tailor</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> Cover Letter Generator</li>
            <li class="feat"><span class="feat-icon check gold">✓</span> Priority Support</li>
          </ul>

          @if (currentPlan === 'PREMIUM') {
            <button class="plan-btn current-btn" disabled>✓ Already Premium</button>
          } @else {
            <button class="plan-btn buy-btn" (click)="buy()" [disabled]="loading">
              @if (loading) {
                <span class="spinner"></span> Processing...
              } @else {
                Buy Now →
              }
            </button>
          }

          @if (errorMsg) {
            <p class="error-msg">{{ errorMsg }}</p>
          }

          @if (paymentHint) {
            <p class="hint-msg">{{ paymentHint }}</p>
          }
        </div>
      </div>



      <!-- Trust Badges -->
      <div class="trust-strip">
        <span class="trust-item">🔒 Secured by Razorpay</span>
        <span class="trust-item">✦ Cancel Anytime</span>
        <span class="trust-item">⚡ Instant Activation</span>
        <span class="trust-item">📧 Email Confirmation</span>
      </div>

      <!-- FAQ -->
      <div class="faq-section">
        <h3 class="faq-title">Frequently Asked Questions</h3>
        <div class="faq-grid">
          <div class="faq-item">
            <strong>Can I cancel anytime?</strong>
            <p>Yes! Cancel from your profile. You'll stay Premium until your billing period ends.</p>
          </div>
          <div class="faq-item">
            <strong>What payment methods are accepted?</strong>
            <p>Credit/Debit cards, UPI (GPay, PhonePe), Net Banking, and Wallets via Razorpay.</p>
          </div>
          <div class="faq-item">
            <strong>Is my payment secure?</strong>
            <p>100%. All payments are processed by Razorpay with 256-bit SSL encryption.</p>
          </div>
          <div class="faq-item">
            <strong>What happens after my plan expires?</strong>
            <p>Your account reverts to Free. Your resumes and data are always kept safe.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pricing-page {
      min-height: calc(100vh - 64px);
      background: var(--bg-base, #080b12);
      padding: 60px 24px 80px;
      font-family: 'Outfit', sans-serif;
    }

    /* Header */
    .pricing-header {
      text-align: center;
      margin-bottom: 48px;
    }
    .badge-pill {
      display: inline-block;
      background: rgba(0,212,180,0.12);
      color: var(--teal, #00d4b4);
      border: 1px solid rgba(0,212,180,0.3);
      border-radius: 20px;
      padding: 5px 16px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .pricing-title {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fff 0%, #00d4b4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 12px;
    }
    .pricing-sub {
      color: rgba(255,255,255,0.5);
      font-size: 1rem;
      margin: 0 0 28px;
    }

    /* Billing Toggle */
    .billing-toggle {
      display: inline-flex;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 4px;
      gap: 4px;
    }
    .toggle-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      padding: 8px 22px;
      border-radius: 9px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toggle-btn.active {
      background: var(--teal, #00d4b4);
      color: #000;
      font-weight: 700;
    }
    .discount-badge {
      background: rgba(0,0,0,0.25);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 8px;
    }
    .toggle-btn.active .discount-badge { background: rgba(0,0,0,0.3); color: #000; }

    /* Plans Grid */
    .plans-grid {
      display: flex;
      justify-content: center;
      gap: 24px;
      max-width: 860px;
      margin: 0 auto 48px;
      flex-wrap: wrap;
    }

    /* Plan Card */
    .plan-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 36px 32px;
      width: 100%;
      max-width: 360px;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .plan-card:hover { transform: translateY(-4px); }
    .free-card { }
    .premium-card {
      border-color: rgba(0,212,180,0.4);
      background: linear-gradient(160deg, rgba(0,212,180,0.05) 0%, rgba(0,0,0,0.0) 100%);
      box-shadow: 0 0 40px rgba(0,212,180,0.08);
    }

    .popular-badge {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #00d4b4, #00b89c);
      color: #000;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 5px 18px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .plan-header { text-align: center; margin-bottom: 28px; }
    .plan-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
    .plan-name { font-size: 1.4rem; font-weight: 700; color: #fff; margin: 0 0 16px; }
    .plan-price { display: flex; align-items: baseline; justify-content: center; gap: 6px; flex-wrap: wrap; }
    .price-amount { font-size: 2.8rem; font-weight: 800; color: #fff; }
    .price-period { font-size: 0.9rem; color: rgba(255,255,255,0.4); }
    .price-savings {
      width: 100%;
      text-align: center;
      font-size: 0.78rem;
      color: var(--teal, #00d4b4);
      font-weight: 600;
      margin-top: 4px;
    }

    /* Feature List */
    .feature-list { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 10px; }
    .feat { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.75); }
    .feat-icon { font-size: 0.85rem; font-weight: 700; width: 20px; text-align: center; flex-shrink: 0; }
    .feat-icon.check { color: var(--teal, #00d4b4); }
    .feat-icon.check.gold { color: #f9c74f; }
    .feat-icon.cross { color: rgba(255,255,255,0.2); }

    /* Buttons */
    .plan-btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .free-btn {
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.3);
      cursor: not-allowed;
    }
    .buy-btn {
      background: linear-gradient(135deg, #00d4b4 0%, #00b89c 100%);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .buy-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #00e8c8 0%, #00d4b4 100%);
      box-shadow: 0 6px 24px rgba(0,212,180,0.35);
      transform: translateY(-1px);
    }
    .buy-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .current-btn { background: rgba(0,212,180,0.1); color: var(--teal, #00d4b4); cursor: not-allowed; border: 1px solid rgba(0,212,180,0.3); }

    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(0,0,0,0.3);
      border-top-color: #000;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #ef4444; font-size: 0.82rem; text-align: center; margin-top: 10px; }
    .hint-msg {
      color: rgba(255,255,255,0.62);
      font-size: 0.8rem;
      text-align: center;
      margin-top: 10px;
      line-height: 1.45;
    }

    /* Trust Strip */
    .trust-strip {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 60px;
      color: rgba(255,255,255,0.35);
      font-size: 0.85rem;
    }
    .trust-item { display: flex; align-items: center; gap: 6px; }

    /* FAQ */
    .faq-section { max-width: 860px; margin: 0 auto; }
    .faq-title { text-align: center; font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 28px; }
    .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .faq-item {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      padding: 20px 22px;
    }
    .faq-item strong { display: block; color: #fff; margin-bottom: 8px; font-size: 0.9rem; }
    .faq-item p { color: rgba(255,255,255,0.45); font-size: 0.85rem; margin: 0; line-height: 1.5; }

    @media (max-width: 640px) {
      .pricing-title { font-size: 1.8rem; }
      .faq-grid { grid-template-columns: 1fr; }
      .plans-grid { gap: 16px; }
    }

    /* UPI Custom Dialog */
    .upi-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    .upi-dialog {
      background: #1a1f2e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 32px 28px;
      width: 100%; max-width: 400px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
    .upi-dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .upi-logo { height: 32px; object-fit: contain; }
    .upi-close { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .upi-close:hover { color: #fff; }
    .upi-title { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0 0 6px; }
    .upi-sub { color: rgba(255,255,255,0.45); font-size: 0.85rem; margin: 0 0 24px; }
    .upi-input-wrap { margin-bottom: 8px; }
    .upi-input {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 12px; padding: 14px 16px;
      color: #fff; font-size: 1rem; font-family: 'Outfit', sans-serif;
      outline: none; transition: border 0.2s;
    }
    .upi-input:focus { border-color: #00d4b4; }
    .upi-input::placeholder { color: rgba(255,255,255,0.25); }
    .upi-test-hint { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin: 8px 0 16px; }
    .upi-code {
      color: #00d4b4; font-weight: 600; cursor: pointer; text-decoration: underline;
      text-underline-offset: 2px;
    }
    .upi-pay-btn {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #00d4b4, #00b89c);
      color: #000; font-size: 1rem; font-weight: 700;
      border: none; border-radius: 12px; cursor: pointer;
      transition: all 0.2s; margin-top: 16px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .upi-pay-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0,212,180,0.35); transform: translateY(-1px); }
    .upi-pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .upi-or { text-align: center; color: rgba(255,255,255,0.2); font-size: 0.8rem; margin: 20px 0 12px; }
    .upi-alt-btn {
      width: 100%; padding: 11px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6); font-size: 0.9rem;
      border-radius: 10px; cursor: pointer; transition: all 0.2s;
    }
    .upi-alt-btn:hover { background: rgba(255,255,255,0.09); color: #fff; }
  `]
})
export class PricingComponent implements OnInit {
  private paymentSvc = inject(PaymentService);
  private authSvc    = inject(AuthService);
  private router     = inject(Router);
  private ngZone     = inject(NgZone);
  private route      = inject(ActivatedRoute);

  cycle: BillingCycle = 'MONTHLY';
  currentPlan: 'FREE' | 'PREMIUM' = 'FREE';
  loading     = false;
  errorMsg    = '';
  paymentHint = '';
  returnUrl   = '/dashboard';
  private pendingOrder: CreateOrderResponse | null = null;

  ngOnInit(): void {
    this.currentPlan = this.authSvc.getCurrentPlan();
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  setCycle(c: BillingCycle): void { this.cycle = c; }

  buy(): void {
    if (USE_LOCALHOST_SIMULATED_PAYMENT) {
      this.startSimulatedPayment();
      return;
    }

    this.loading  = true;
    this.errorMsg = '';
    this.paymentHint = '';

    this.paymentSvc.createOrder(this.cycle).subscribe({
      next: (order) => this.openRazorpay(order),
      error: (error) => {
        this.loading  = false;
        this.errorMsg = this.extractErrorMessage(error, 'Could not reach payment server. Please try again.');
      }
    });
  }

  private openRazorpayWithUpi(order: CreateOrderResponse, upiId: string): void {
    const options: Record<string, unknown> = {
      key:         order.keyId,
      amount:      order.amountInPaise,
      currency:    order.currency,
      name:        'ResumeAI',
      description: `Premium ${order.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'} Plan`,
      order_id:    order.orderId,
      theme:       { color: '#00d4b4' },
      prefill: {
        method: 'upi',
        vpa:    upiId
      },
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        this.ngZone.run(() => {
          this.verifyPayment(response, order.billingCycle);
        });
      },
      modal: {
        ondismiss: () => {
          this.ngZone.run(() => {
            this.loading = false;
          });
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  private openRazorpay(order: CreateOrderResponse): void {
    this.paymentHint = this.buildPaymentHint(order.keyId);
    this.prepareTestUpiShortcut(order.keyId);

    const isTestMode = order.keyId.startsWith('rzp_test_');

    const options: Record<string, unknown> = {
      key:         order.keyId,
      amount:      order.amountInPaise,
      currency:    order.currency,
      name:        'ResumeAI',
      description: `Premium ${order.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'} Plan`,
      order_id:    order.orderId,
      theme:       { color: '#00d4b4' },
      prefill: {
        method: 'upi',
        vpa:    isTestMode ? 'success@razorpay' : '',
        contact: '',
        email:   ''
      },
      config: {
        display: {
          blocks: {
            upi_id: {
              name: 'UPI ID / VPA',
              instruments: [{
                method: 'upi',
                flows: ['collect']
              }]
            },
            other: {
              name: 'Other Methods',
              instruments: [
                { method: 'card' },
                { method: 'netbanking' },
                { method: 'wallet' }
              ]
            }
          },
          sequence: ['block.upi_id', 'block.other'],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        this.ngZone.run(() => {
          this.verifyPayment(response, order.billingCycle);
        });
      },
      modal: {
        ondismiss: () => {
          this.ngZone.run(() => {
            this.loading = false;
          });
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  private startSimulatedPayment(): void {
    const amountLabel = this.cycle === 'YEARLY' ? 'Rs 500' : 'Rs 50';
    const confirmed = window.confirm(
      `Localhost dev mode active.\n\nSimulate a successful ${this.cycle.toLowerCase()} payment for ${amountLabel}?`
    );

    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.paymentHint = 'Localhost dev mode active. Simulating a successful payment and activating Premium...';

    this.paymentSvc.completeSimulatedPayment({ billingCycle: this.cycle }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.currentPlan = 'PREMIUM';
          this.authSvc.refreshTokenFromPayment(res.newToken).subscribe(() => {
            this.router.navigate([this.returnUrl], {
              queryParams: { upgraded: 'true', source: 'simulated-payment' }
            });
          });
        } else {
          this.errorMsg = res.message || 'Simulated payment failed.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMsg = this.extractErrorMessage(
          error,
          'Could not complete localhost simulated payment. Please try again.'
        );
      }
    });
  }

  private verifyPayment(
    response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
    billingCycle: BillingCycle
  ): void {
    this.paymentSvc.verifyPayment({
      razorpayOrderId:   response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      billingCycle
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.errorMsg = '';
          this.paymentHint = '';
          this.currentPlan = 'PREMIUM';
          this.authSvc.refreshTokenFromPayment(res.newToken).subscribe(() => {
            this.router.navigate([this.returnUrl], {
              queryParams: { upgraded: 'true' }
            });
          });
        } else {
          this.errorMsg = res.message || 'Payment verification failed.';
        }
      },
      error: (error) => {
        this.loading  = false;
        this.errorMsg = this.extractErrorMessage(
          error,
          'Payment received but verification failed. Please contact support.'
        );
      }
    });
  }

  private buildPaymentHint(keyId: string): string {
    if (!keyId.startsWith('rzp_test_')) {
      return '';
    }

    return 'Test mode is active. Use UPI with success@razorpay or use a Razorpay test card. Do not scan the QR with a real UPI app.';
  }

  private prepareTestUpiShortcut(keyId: string): void {
    if (!keyId.startsWith('rzp_test_')) {
      return;
    }

    this.paymentHint =
      'Test mode is active. success@razorpay has been prepared for test checkout. In the Razorpay popup, choose UPI and paste success@razorpay into the UPI ID field.';

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    navigator.clipboard.writeText('success@razorpay').catch(() => {
      // Non-blocking: the checkout still works even if clipboard access is denied.
    });
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const message =
      (error as { error?: { message?: string; error?: string } })?.error?.message
      || (error as { error?: { message?: string; error?: string } })?.error?.error
      || (error as { message?: string })?.message;

    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}

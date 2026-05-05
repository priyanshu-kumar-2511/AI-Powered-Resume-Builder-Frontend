import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../config/api.config';

export interface AdminSubscriptionResponse {
  id:                number;
  userId:            number;
  username:          string;
  fullName:          string;
  plan:              'FREE' | 'PREMIUM';
  billingCycle:      'MONTHLY' | 'YEARLY';
  status:            'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate:         string;
  endDate:           string;
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  createdAt:         string;
}

export interface SubscriptionStats {
  totalActiveSubscriptions:    number;
  totalExpiredSubscriptions:   number;
  totalCancelledSubscriptions: number;
  totalRevenueInPaise:         number;
  planDistribution:            Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class AdminPaymentService {
  private http = inject(HttpClient);
  private adminApi = `${API_BASE}/admin/subscriptions`;

  getSubscriptions(page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`${this.adminApi}?page=${page}&size=${size}`);
  }

  getStats(): Observable<SubscriptionStats> {
    return this.http.get<SubscriptionStats>(`${this.adminApi}/stats`);
  }
}

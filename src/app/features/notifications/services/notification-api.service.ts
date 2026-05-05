import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NOTIFICATION_API } from '../../../core/config/api.config';
import { Notification, NotificationPage } from '../../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private http = inject(HttpClient);

  getByRecipient(userId: number, page = 0, size = 20): Observable<NotificationPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<NotificationPage>(`${NOTIFICATION_API}/recipient/${userId}`, { params });
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<number>(`${NOTIFICATION_API}/recipient/${userId}/unread-count`);
  }

  markRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${NOTIFICATION_API}/${notificationId}/mark-read`, {});
  }

  markAllRead(userId: number): Observable<void> {
    return this.http.put<void>(`${NOTIFICATION_API}/recipient/${userId}/mark-all-read`, {});
  }

  delete(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${NOTIFICATION_API}/${notificationId}`);
  }
}

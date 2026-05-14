import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  type?: 'info' | 'danger' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new Subject<{ options: ConfirmOptions, resolve: (val: boolean) => void }>();
  confirm$ = this.confirmSubject.asObservable();

  /**
   * Opens a confirmation modal and returns a promise that resolves to true (confirmed) or false (cancelled).
   */
  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmSubject.next({ options, resolve });
    });
  }

  /**
   * Opens an alert modal (no cancel button).
   */
  alert(title: string, message: string, type: 'info' | 'success' | 'danger' = 'info'): Promise<void> {
    return new Promise((resolve) => {
      this.confirmSubject.next({
        options: { title, message, confirmText: 'OK', cancelText: null, type },
        resolve: () => resolve()
      });
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cm-backdrop" (click)="onBackdropClick($event)">
      <div class="cm-card" role="dialog" aria-modal="true">
        <div class="cm-icon-wrapper" [class.danger]="type === 'danger'" [class.success]="type === 'success'">
          @if (type === 'danger') {
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          } @else if (type === 'success') {
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          } @else {
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        </div>

        <div class="cm-content">
          <h2 class="cm-title">{{ title }}</h2>
          <p class="cm-message">{{ message }}</p>
        </div>

        <div class="cm-actions" [class.alert-mode]="!cancelText">
          @if (cancelText) {
            <button type="button" class="cm-btn cm-btn-cancel" (click)="cancel.emit()">
              {{ cancelText }}
            </button>
          }
          <button type="button" class="cm-btn cm-btn-confirm" [class.danger]="type === 'danger'" [class.success]="type === 'success'" (click)="confirm.emit()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cm-backdrop {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .cm-card {
      width: 100%;
      max-width: 400px;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 32px 24px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .cm-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      margin-bottom: 20px;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .cm-icon-wrapper.danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .cm-icon-wrapper.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .cm-content {
      margin-bottom: 32px;
    }

    .cm-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f9fafb;
      margin: 0 0 8px;
    }

    .cm-message {
      font-size: 0.9375rem;
      color: #9ca3af;
      line-height: 1.5;
      margin: 0;
    }

    .cm-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      width: 100%;
    }

    .cm-actions.alert-mode {
      grid-template-columns: 1fr;
      max-width: 160px;
      margin: 0 auto;
    }

    .cm-btn {
      padding: 12px;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      font-family: inherit;
    }

    .cm-btn-cancel {
      background: rgba(255, 255, 255, 0.05);
      color: #d1d5db;
    }

    .cm-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f3f4f6;
    }

    .cm-btn-confirm {
      background: #3b82f6;
      color: white;
    }

    .cm-btn-confirm:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .cm-btn-confirm.danger {
      background: #ef4444;
    }

    .cm-btn-confirm.danger:hover {
      background: #dc2626;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .cm-btn-confirm.success {
      background: #10b981;
    }

    .cm-btn-confirm.success:hover {
      background: #059669;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .cm-btn:active {
      transform: scale(0.98);
    }
  `]
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText: string | null = 'Cancel';
  @Input() type: 'info' | 'danger' | 'success' = 'info';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cm-backdrop')) {
      this.cancel.emit();
    }
  }
}

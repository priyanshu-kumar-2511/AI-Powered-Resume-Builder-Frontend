import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-premium-lock',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="premium-lock">
      <div class="lock-icon">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <p class="lock-title">Premium Feature</p>
      <p class="lock-desc">{{ message }}</p>
      <a routerLink="/profile" class="lock-btn">
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
        Upgrade to Premium
      </a>
    </div>
  `,
  styles: [`
    .premium-lock {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 28px 20px; text-align: center;
    }
    .lock-icon {
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(250,204,21,0.08); border: 1px solid rgba(250,204,21,0.2);
      display: grid; place-items: center; color: #facc15;
    }
    .lock-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.85); margin: 0; }
    .lock-desc { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0; max-width: 200px; line-height: 1.5; }
    .lock-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #facc15, #f59e0b);
      color: #000; font-weight: 700; font-size: 0.78rem;
      padding: 9px 18px; border-radius: 8px; text-decoration: none;
      transition: all 0.2s; margin-top: 4px;
    }
    .lock-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(250,204,21,0.3); }
  `]
})
export class PremiumLockComponent {
  @Input() message = 'Upgrade to Premium to unlock this feature.';
}

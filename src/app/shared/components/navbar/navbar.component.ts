import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../../../features/notifications/bell/notification-bell.component';
import { NotificationPollingService } from '../../../features/notifications/services/notification-polling.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, NotificationBellComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  auth     = inject(AuthService);
  router   = inject(Router);
  polling  = inject(NotificationPollingService);

  menuOpen = false;

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.getProfile().subscribe();
      if (!this.auth.isAdmin()) {
        this.polling.startPolling();
      }
    }
  }

  logout(): void { this.polling.stopPolling(); this.auth.logout(); }
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu():  void { this.menuOpen = false; }

  /**
   * Checks admin status from both the profile signal AND JWT claims.
   * Combining both means the navbar shows correctly even before getProfile()
   * resolves (JWT claims are decoded synchronously from localStorage).
   */
  get isAdmin(): boolean { return this.auth.isAdmin(); }
}

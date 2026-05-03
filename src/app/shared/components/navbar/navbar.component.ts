import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  auth   = inject(AuthService);
  router = inject(Router);

  menuOpen = false;

  ngOnInit(): void {
    // Always load profile when logged in so isAdmin() / getCurrentPlan() work
    // immediately — don't skip if currentUser is already set (it may be stale)
    if (this.auth.isLoggedIn()) {
      this.auth.getProfile().subscribe();
    }
  }

  logout(): void { this.auth.logout(); }
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu():  void { this.menuOpen = false; }

  /**
   * Checks admin status from both the profile signal AND JWT claims.
   * Combining both means the navbar shows correctly even before getProfile()
   * resolves (JWT claims are decoded synchronously from localStorage).
   */
  get isAdmin(): boolean { return this.auth.isAdmin(); }
}

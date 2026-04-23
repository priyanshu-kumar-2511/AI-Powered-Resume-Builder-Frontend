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

  ngOnInit() {
    if (this.auth.isLoggedIn() && !this.auth.currentUser()) {
      this.auth.getProfile().subscribe();
    }
  }

  logout() {
    this.auth.logout();
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu()  { this.menuOpen = false; }
}

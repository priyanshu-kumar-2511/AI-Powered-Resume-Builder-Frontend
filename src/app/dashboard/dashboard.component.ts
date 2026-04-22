import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';

/**
 * DashboardComponent is the main landing page for authenticated users.
 * It displays a grid of saved resumes and provides access to the resume builder.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  resumes: any[] = [];
  isLoading = true;
  isAdmin = false;

  get publishedCount(): number {
    return 0;
  }

  ngOnInit(): void {
    this.isLoading = false;
    this.isAdmin = this.authService.isAdmin();
  }

  /**
   * Placeholder for the "Create New Resume" action.
   */
  onCreateNew(): void {
    console.log('Navigating to Resume Builder...');
  }

  /**
   * Navigates to the Account Settings/Profile page.
   */
  onSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Navigates to the Admin Panel.
   */
  onAdmin(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Signs the user out and clears the authentication state.
   */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

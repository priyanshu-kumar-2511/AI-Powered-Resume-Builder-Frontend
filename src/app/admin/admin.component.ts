import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  users: any[] = [];
  isLoading = true;
  error: string = '';

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.authService.adminGetAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user list. Access denied?';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  toggleStatus(username: string, currentStatus: boolean): void {
    this.authService.adminUpdateStatus(username, !currentStatus).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert('Operation failed: ' + (err.error?.message || 'Unauthorized'))
    });
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

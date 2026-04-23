import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { TemplateService } from '../../core/services/template.service';
import { UserProfileResponse, TemplateResponseDTO } from '../../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  auth        = inject(AuthService);
  templateSvc = inject(TemplateService);

  profile:  UserProfileResponse | null = null;
  popular:  TemplateResponseDTO[]      = [];
  loadingProfile   = true;
  loadingTemplates = true;

  // Placeholder stats — replace with real API calls once resume/ai services are available
  stats = [
    { icon: '📄', label: 'Resumes Created', value: '—', color: 'var(--teal)' },
    { icon: '📊', label: 'Job Matches', value: '—', color: 'var(--gold)' },
    { icon: '📥', label: 'Exports', value: '—', color: '#a78bfa' },
    { icon: '🔔', label: 'Notifications', value: '—', color: '#fb923c' }
  ];

  services = [
    { icon: '📝', title: 'Resume Builder', desc: 'Build and manage your resumes with AI assistance.', route: '/dashboard', badge: 'Available', color: 'var(--teal)' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Generate compelling bullet points and summaries.', route: '/dashboard', badge: 'Coming Soon', color: '#a78bfa' },
    { icon: '🎯', title: 'Job Matcher', desc: 'Match your resume to any job description.', route: '/dashboard', badge: 'Coming Soon', color: '#C9A84C' },
    { icon: '📤', title: 'PDF Export', desc: 'Export your resume as a high-quality PDF.', route: '/dashboard', badge: 'Coming Soon', color: '#fb923c' },
    { icon: '🔔', title: 'Notifications', desc: 'Stay updated with job market alerts.', route: '/dashboard', badge: 'Coming Soon', color: '#34d399' },
    { icon: '🎨', title: 'Templates', desc: 'Browse and apply beautiful resume templates.', route: '/templates', badge: 'Available', color: 'var(--teal)' }
  ];

  ngOnInit() {
    // Always fetch fresh profile so OAuth users also see their name in the greeting.
    // If currentUser signal already has data, we still refresh it to keep it in sync.
    this.auth.getProfile().subscribe({
      next: (u) => { this.profile = u; this.loadingProfile = false; },
      error: () => {
        // Fallback to cached signal if API fails
        this.profile = this.auth.currentUser();
        this.loadingProfile = false;
      }
    });

    this.templateSvc.getPopularTemplates().subscribe({
      next: (t) => { this.popular = t.slice(0, 4); this.loadingTemplates = false; },
      error: () => { this.loadingTemplates = false; }
    });
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get firstName(): string {
    return (this.profile?.fullName || 'there').split(' ')[0];
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}


import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { TemplateService } from '../../core/services/template.service';
import { ResumeStateService } from '../resume/services/resume-state.service';
import { TemplateResponseDTO, UserProfileResponse } from '../../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  templateSvc = inject(TemplateService);
  resumeState = inject(ResumeStateService);

  profile: UserProfileResponse | null = null;
  popular: TemplateResponseDTO[] = [];
  loadingProfile = true;
  loadingTemplates = true;

  stats = [
    { icon: '📄', label: 'Resumes Created', value: '0', color: 'var(--teal)' },
    { icon: '📊', label: 'Job Matches',      value: '0', color: 'var(--gold)' },
    { icon: '📥', label: 'Exports',          value: '0', color: '#a78bfa' },
    { icon: '🌍', label: 'Public Resumes',  value: '0', color: '#fb923c' }
  ];

  services = [
    { icon: '📝', title: 'Resume Builder', desc: 'Build and manage your resumes with AI assistance.', route: '/resumes', badge: 'Available', color: 'var(--teal)' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Generate AI summaries, bullets & ATS scores in the builder.', route: '/resumes', badge: 'Available', color: '#a78bfa' },
    { icon: '🎯', title: 'Job Matcher', desc: 'Match your resume to any job description.', route: '/dashboard', badge: 'Coming Soon', color: '#C9A84C' },
    { icon: '📤', title: 'PDF Export', desc: 'Export your resume as a high-quality PDF.', route: '/resumes', badge: 'Available', color: '#fb923c' },
    { icon: '🌍', title: 'Public Gallery', desc: 'Explore published resumes and track public visibility.', route: '/resumes/public', badge: 'Available', color: '#34d399' },
    { icon: '🎨', title: 'Templates', desc: 'Browse and apply beautiful resume templates.', route: '/templates', badge: 'Available', color: 'var(--teal)' }
  ];

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.router.navigateByUrl('/admin');
      return;
    }

    this.auth.getProfile().subscribe({
      next: (user) => {
        this.profile = user;
        this.loadingProfile = false;
      },
      error: () => {
        this.profile = this.auth.currentUser();
        this.loadingProfile = false;
      }
    });

    this.templateSvc.getPopularTemplates().subscribe({
      next: (templates) => {
        this.popular = templates.slice(0, 4);
        this.loadingTemplates = false;
      },
      error: () => {
        this.loadingTemplates = false;
      }
    });

    this.resumeState.load().subscribe({
      next: (resumes) => {
        this.stats[0].value = String(resumes.length);
        this.stats[3].value = String(resumes.filter((resume) => resume.isPublic).length);
      },
      error: () => undefined
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

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
  }
}

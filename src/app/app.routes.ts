import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './features/admin/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'forgot-username',
    loadComponent: () => import('./features/auth/forgot-username/forgot-username.component').then(m => m.ForgotUsernameComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'resumes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/resume/dashboard/resume-dashboard.component').then(m => m.ResumeDashboardComponent)
  },
  {
    path: 'resumes/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/resume/create/create-resume.component').then(m => m.CreateResumeComponent)
  },
  {
    path: 'resumes/public',
    loadComponent: () => import('./features/resume/public-gallery/public-gallery.component').then(m => m.PublicGalleryComponent)
  },
  {
    path: 'builder/:resumeId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/builder/layout/builder-layout.component').then(m => m.BuilderLayoutComponent)
  },
  {
    path: 'templates',
    loadComponent: () => import('./features/templates/template-list/template-list.component').then(m => m.TemplateListComponent)
  },
  {
    path: 'templates/:id',
    loadComponent: () => import('./features/templates/template-detail/template-detail.component').then(m => m.TemplateDetailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/profile/profile.component').then(m => m.ProfileComponent)
  },

  // ── ADMIN PANEL ──────────────────────────────────────────────────────────────
  // IMPORTANT: Must be BEFORE the wildcard '**' route, otherwise Angular's router
  // matches '**' first and redirects all admin URLs to home.
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent),
    children: [
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-users.component')
          .then(m => m.AdminUsersComponent)
      },
      {
        path: 'templates',
        loadComponent: () => import('./features/admin/templates/admin-templates.component')
          .then(m => m.AdminTemplatesComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/admin/analytics/admin-analytics.component')
          .then(m => m.AdminAnalyticsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/admin/notifications/admin-notifications.component')
          .then(m => m.AdminNotificationsComponent)
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      }
    ]
  },

  // Wildcard MUST be last
  { path: '**', redirectTo: '' }
];

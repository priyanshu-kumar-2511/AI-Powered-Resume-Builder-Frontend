import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { adminGuard } from './auth/guards/admin.guard';

export const routes: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'recovery', loadComponent: () => import('./auth/recovery/recovery.component').then(m => m.RecoveryComponent) },
  { path: 'login-success', loadComponent: () => import('./auth/login-success/login-success.component').then(m => m.LoginSuccessComponent) },
  { 
    path: 'settings', 
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

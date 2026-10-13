import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';
import { RoleName } from './core/models';
import { ShellComponent } from './layout/shell';

const STAFF: RoleName[] = ['ROLE_SECRETARY_1', 'ROLE_SECRETARY_2', 'ROLE_ADMIN'];
const COUNCIL: RoleName[] = ['ROLE_SECRETARY_1', 'ROLE_SECRETARY_2', 'ROLE_PRESIDENT', 'ROLE_COUNCILOR', 'ROLE_ADMIN'];
const MINUTES: RoleName[] = ['ROLE_SECRETARY_1', 'ROLE_PRESIDENT', 'ROLE_ADMIN'];
const LIVE: RoleName[] = ['ROLE_SECRETARY_1', 'ROLE_PRESIDENT', 'ROLE_COUNCILOR', 'ROLE_ADMIN'];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/forgot').then((m) => m.ForgotPage),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/reset').then((m) => m.ResetPage),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      {
        path: 'requests',
        canActivate: [roleGuard],
        data: { roles: STAFF },
        loadComponent: () => import('./pages/requests/requests').then((m) => m.RequestsPage),
      },
      {
        path: 'requests/new',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARY_2'] },
        loadComponent: () => import('./pages/requests/request-form').then((m) => m.RequestFormPage),
      },
      {
        path: 'requests/:id/edit',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARY_2'] },
        loadComponent: () => import('./pages/requests/request-form').then((m) => m.RequestFormPage),
      },
      {
        path: 'requests/:id',
        canActivate: [roleGuard],
        data: { roles: STAFF },
        loadComponent: () => import('./pages/requests/request-detail').then((m) => m.RequestDetailPage),
      },
      {
        path: 'sessions',
        canActivate: [roleGuard],
        data: { roles: COUNCIL },
        loadComponent: () => import('./pages/sessions/sessions').then((m) => m.SessionsPage),
      },
      {
        path: 'sessions/new',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARY_1'] },
        loadComponent: () => import('./pages/sessions/session-new').then((m) => m.SessionNewPage),
      },
      {
        path: 'sessions/:id/live',
        canActivate: [roleGuard],
        data: { roles: LIVE },
        loadComponent: () => import('./pages/sessions/session-live').then((m) => m.SessionLivePage),
      },
      {
        path: 'sessions/:id',
        canActivate: [roleGuard],
        data: { roles: COUNCIL },
        loadComponent: () => import('./pages/sessions/session-detail').then((m) => m.SessionDetailPage),
      },
      {
        path: 'minutes',
        canActivate: [roleGuard],
        data: { roles: MINUTES },
        loadComponent: () => import('./pages/minutes/minutes').then((m) => m.MinutesPage),
      },
      {
        path: 'minutes/:id',
        canActivate: [roleGuard],
        data: { roles: MINUTES },
        loadComponent: () => import('./pages/minutes/minutes-detail').then((m) => m.MinutesDetailPage),
      },
      {
        path: 'repository',
        canActivate: [roleGuard],
        data: { roles: COUNCIL },
        loadComponent: () => import('./pages/repository/repository').then((m) => m.RepositoryPage),
      },
      {
        path: 'templates',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_DEV'] },
        loadComponent: () => import('./pages/templates/templates').then((m) => m.TemplatesPage),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_DEV'] },
        loadComponent: () => import('./pages/users/users').then((m) => m.UsersPage),
      },
      {
        path: 'hierarchy',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./pages/hierarchy/hierarchy').then((m) => m.HierarchyPage),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage),
      },
      {
        path: 'audit',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./pages/audit/audit').then((m) => m.AuditPage),
      },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: '' },
];

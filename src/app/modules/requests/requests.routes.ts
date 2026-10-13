import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';
import { COUNCIL_ROLES, STAFF_ROLES } from '@core/auth/role-groups';

export const requestsRoutes: Routes = [
  {
    path: 'requests',
    canActivate: [roleGuard],
    data: { roles: STAFF_ROLES },
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
    data: { roles: STAFF_ROLES },
    loadComponent: () => import('./pages/requests/request-detail').then((m) => m.RequestDetailPage),
  },
  {
    path: 'sessions',
    canActivate: [roleGuard],
    data: { roles: COUNCIL_ROLES },
    loadComponent: () => import('./pages/sessions/sessions').then((m) => m.SessionsPage),
  },
  {
    path: 'sessions/new',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_SECRETARY_1'] },
    loadComponent: () => import('./pages/sessions/session-new').then((m) => m.SessionNewPage),
  },
  {
    path: 'sessions/:id',
    canActivate: [roleGuard],
    data: { roles: COUNCIL_ROLES },
    loadComponent: () => import('./pages/sessions/session-detail').then((m) => m.SessionDetailPage),
  },
];

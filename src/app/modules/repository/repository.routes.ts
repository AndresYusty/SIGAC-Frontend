import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';
import { REPOSITORY_ROLES } from '@core/auth/role-groups';

export const repositoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
  },
  {
    path: 'repository',
    canActivate: [roleGuard],
    data: { roles: REPOSITORY_ROLES },
    loadComponent: () => import('./pages/repository/repository').then((m) => m.RepositoryPage),
  },
  {
    path: 'audit',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () => import('./pages/audit/audit').then((m) => m.AuditPage),
  },
];

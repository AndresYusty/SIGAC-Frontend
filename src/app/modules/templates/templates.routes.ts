import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';

export const templatesRoutes: Routes = [
  {
    path: 'templates',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_DEV'] },
    loadComponent: () => import('./pages/templates/templates').then((m) => m.TemplatesPage),
  },
];

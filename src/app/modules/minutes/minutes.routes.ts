import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';
import { MINUTES_ROLES } from '@core/auth/role-groups';

export const minutesRoutes: Routes = [
  {
    path: 'minutes',
    canActivate: [roleGuard],
    data: { roles: MINUTES_ROLES },
    loadComponent: () => import('./pages/minutes/minutes').then((m) => m.MinutesPage),
  },
  {
    path: 'minutes/:id',
    canActivate: [roleGuard],
    data: { roles: MINUTES_ROLES },
    loadComponent: () => import('./pages/minutes/minutes-detail').then((m) => m.MinutesDetailPage),
  },
];

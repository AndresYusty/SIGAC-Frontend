import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';
import { LIVE_SESSION_ROLES } from '@core/auth/role-groups';

export const sessionRoutes: Routes = [
  {
    path: 'sessions/:id/live',
    canActivate: [roleGuard],
    data: { roles: LIVE_SESSION_ROLES },
    loadComponent: () => import('./pages/session-live/session-live').then((m) => m.SessionLivePage),
  },
];

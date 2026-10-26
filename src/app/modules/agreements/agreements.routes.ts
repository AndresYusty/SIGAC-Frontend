import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';
import { AGREEMENT_ROLES, AGREEMENT_WRITERS } from '@core/auth/role-groups';

export const agreementsRoutes: Routes = [
  {
    path: 'agreements',
    canActivate: [roleGuard],
    data: { roles: AGREEMENT_ROLES },
    loadComponent: () => import('./pages/agreements/agreements').then((m) => m.AgreementsPage),
  },
  {
    path: 'agreements/new',
    canActivate: [roleGuard],
    data: { roles: AGREEMENT_WRITERS },
    loadComponent: () =>
      import('./pages/agreements/agreement-editor').then((m) => m.AgreementEditorPage),
  },
  {
    path: 'agreements/:id',
    canActivate: [roleGuard],
    data: { roles: [...AGREEMENT_WRITERS, 'ROLE_ADMIN'] },
    loadComponent: () =>
      import('./pages/agreements/agreement-editor').then((m) => m.AgreementEditorPage),
  },
];

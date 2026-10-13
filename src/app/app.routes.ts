import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { ShellComponent } from '@layout/shell';
import { minutesRoutes } from '@modules/minutes/minutes.routes';
import { repositoryRoutes } from '@modules/repository/repository.routes';
import { requestsRoutes } from '@modules/requests/requests.routes';
import { sessionRoutes } from '@modules/session/session.routes';
import { templatesRoutes } from '@modules/templates/templates.routes';
import { authRoutes, usersRoutes } from '@modules/users/users.routes';

export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      ...repositoryRoutes,
      ...requestsRoutes,
      ...sessionRoutes,
      ...minutesRoutes,
      ...templatesRoutes,
      ...usersRoutes,
    ],
  },
  { path: '**', redirectTo: '' },
];

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.loggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.loggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = (route.data['roles'] as string[] | undefined) ?? [];
  if (!roles.length || auth.has(...roles)) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

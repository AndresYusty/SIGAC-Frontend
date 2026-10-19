import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RoleName } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { AGREEMENT_ROLES, MINUTES_ROLES, REPOSITORY_ROLES, SESSION_ROLES, STAFF_ROLES } from '@core/auth/role-groups';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { LangSwitchComponent } from '@shared/components/lang-switch';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

interface NavItem {
  path: string;
  labelKey: string;
  roles?: RoleName[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LangSwitchComponent],
  templateUrl: './shell.html',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly toasts = inject(ToastService);
  readonly confirm = inject(ConfirmService);
  readonly year = new Date().getFullYear();

  private readonly items: NavItem[] = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/requests', labelKey: 'nav.requests', roles: STAFF_ROLES },
    { path: '/sessions', labelKey: 'nav.sessions', roles: SESSION_ROLES },
    { path: '/minutes', labelKey: 'nav.minutes', roles: MINUTES_ROLES },
    { path: '/agreements', labelKey: 'nav.agreements', roles: AGREEMENT_ROLES },
    { path: '/repository', labelKey: 'nav.repository', roles: REPOSITORY_ROLES },
    { path: '/templates', labelKey: 'nav.templates', roles: ['ROLE_ADMIN'] },
    { path: '/users', labelKey: 'nav.users', roles: ['ROLE_ADMIN'] },
    { path: '/hierarchy', labelKey: 'nav.hierarchy', roles: ['ROLE_ADMIN'] },
    { path: '/settings', labelKey: 'nav.settings', roles: ['ROLE_ADMIN'] },
    { path: '/audit', labelKey: 'nav.audit', roles: ['ROLE_ADMIN'] },
  ];

  readonly nav = computed(() => this.items.filter((i) => !i.roles || this.auth.has(...i.roles)));

  logout(): void {
    this.auth.logout();
  }
}

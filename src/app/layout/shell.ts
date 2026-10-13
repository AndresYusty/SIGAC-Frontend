import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { RoleName } from '../core/models';
import { ToastService } from '../core/toast.service';
import { TranslatePipe } from '../core/translate.pipe';
import { LangSwitchComponent } from './lang-switch';

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
    { path: '/requests', labelKey: 'nav.requests', roles: ['ROLE_SECRETARY_1', 'ROLE_SECRETARY_2', 'ROLE_ADMIN'] },
    { path: '/sessions', labelKey: 'nav.sessions', roles: ['ROLE_SECRETARY_1', 'ROLE_SECRETARY_2', 'ROLE_PRESIDENT', 'ROLE_COUNCILOR', 'ROLE_ADMIN'] },
    { path: '/minutes', labelKey: 'nav.minutes', roles: ['ROLE_SECRETARY_1', 'ROLE_PRESIDENT', 'ROLE_ADMIN'] },
    { path: '/repository', labelKey: 'nav.repository', roles: ['ROLE_SECRETARY_1', 'ROLE_SECRETARY_2', 'ROLE_PRESIDENT', 'ROLE_COUNCILOR', 'ROLE_ADMIN'] },
    { path: '/templates', labelKey: 'nav.templates', roles: ['ROLE_DEV'] },
    { path: '/users', labelKey: 'nav.users', roles: ['ROLE_ADMIN', 'ROLE_DEV'] },
    { path: '/hierarchy', labelKey: 'nav.hierarchy', roles: ['ROLE_ADMIN'] },
    { path: '/settings', labelKey: 'nav.settings', roles: ['ROLE_ADMIN'] },
    { path: '/audit', labelKey: 'nav.audit', roles: ['ROLE_ADMIN'] },
  ];

  readonly nav = computed(() => this.items.filter((i) => !i.roles || this.auth.has(...i.roles)));

  logout(): void {
    this.auth.logout();
  }
}

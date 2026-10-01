import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { etiquetaRol } from '../core/labels';
import { ToastService } from '../core/toast.service';

interface NavItem {
  path: string;
  label: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly toasts = inject(ToastService);
  readonly confirm = inject(ConfirmService);
  readonly etiquetaRol = etiquetaRol;
  readonly year = new Date().getFullYear();

  private readonly items: NavItem[] = [
    { path: '/', label: 'Inicio' },
    { path: '/solicitudes', label: 'Solicitudes', roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_ADMIN'] },
    { path: '/sesiones', label: 'Sesiones', roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_PRESIDENTE', 'ROLE_CONSEJERO', 'ROLE_ADMIN'] },
    { path: '/actas', label: 'Actas', roles: ['ROLE_SECRETARIA_1', 'ROLE_PRESIDENTE', 'ROLE_ADMIN'] },
    { path: '/repositorio', label: 'Repositorio', roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_PRESIDENTE', 'ROLE_CONSEJERO', 'ROLE_ADMIN'] },
    { path: '/plantillas', label: 'Plantillas', roles: ['ROLE_DEV'] },
    { path: '/usuarios', label: 'Usuarios', roles: ['ROLE_ADMIN', 'ROLE_DEV'] },
    { path: '/jerarquia', label: 'Jerarquía', roles: ['ROLE_ADMIN'] },
    { path: '/configuracion', label: 'Configuración', roles: ['ROLE_ADMIN'] },
    { path: '/auditoria', label: 'Auditoría', roles: ['ROLE_ADMIN'] },
  ];

  readonly nav = computed(() => this.items.filter((i) => !i.roles || this.auth.has(...i.roles)));

  logout(): void {
    this.auth.logout();
  }
}

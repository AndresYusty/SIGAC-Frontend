import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/forgot').then((m) => m.ForgotPage),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/reset').then((m) => m.ResetPage),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      {
        path: 'solicitudes',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/solicitudes/solicitudes').then((m) => m.SolicitudesPage),
      },
      {
        path: 'solicitudes/nueva',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_2'] },
        loadComponent: () => import('./pages/solicitudes/solicitud-form').then((m) => m.SolicitudFormPage),
      },
      {
        path: 'solicitudes/:id/editar',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_2'] },
        loadComponent: () => import('./pages/solicitudes/solicitud-form').then((m) => m.SolicitudFormPage),
      },
      {
        path: 'solicitudes/:id',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/solicitudes/solicitud-detalle').then((m) => m.SolicitudDetallePage),
      },
      {
        path: 'sesiones',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_PRESIDENTE', 'ROLE_CONSEJERO', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/sesiones/sesiones').then((m) => m.SesionesPage),
      },
      {
        path: 'sesiones/nueva',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1'] },
        loadComponent: () => import('./pages/sesiones/sesion-nueva').then((m) => m.SesionNuevaPage),
      },
      {
        path: 'sesiones/:id/vivo',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_PRESIDENTE', 'ROLE_CONSEJERO', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/sesiones/sesion-vivo').then((m) => m.SesionVivoPage),
      },
      {
        path: 'sesiones/:id',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_PRESIDENTE', 'ROLE_CONSEJERO', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/sesiones/sesion-detalle').then((m) => m.SesionDetallePage),
      },
      {
        path: 'actas',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_PRESIDENTE', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/actas/actas').then((m) => m.ActasPage),
      },
      {
        path: 'actas/:id',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_PRESIDENTE', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/actas/acta-detalle').then((m) => m.ActaDetallePage),
      },
      {
        path: 'repositorio',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SECRETARIA_1', 'ROLE_SECRETARIA_2', 'ROLE_PRESIDENTE', 'ROLE_CONSEJERO', 'ROLE_ADMIN'] },
        loadComponent: () => import('./pages/repositorio/repositorio').then((m) => m.RepositorioPage),
      },
      {
        path: 'plantillas',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_DEV'] },
        loadComponent: () => import('./pages/plantillas/plantillas').then((m) => m.PlantillasPage),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_DEV'] },
        loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.UsuariosPage),
      },
      {
        path: 'jerarquia',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./pages/jerarquia/jerarquia').then((m) => m.JerarquiaPage),
      },
      {
        path: 'configuracion',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./pages/configuracion/configuracion').then((m) => m.ConfiguracionPage),
      },
      {
        path: 'auditoria',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./pages/auditoria/auditoria').then((m) => m.AuditoriaPage),
      },
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];

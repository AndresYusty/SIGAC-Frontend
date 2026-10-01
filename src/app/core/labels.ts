import {
  EstadoActa,
  EstadoSesion,
  EstadoSolicitud,
  ResultadoDecision,
  TipoSolicitud,
} from './models';

export const ROL_ETIQUETA: Record<string, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_DEV: 'Perfil técnico',
  ROLE_SECRETARIA_1: 'Secretaría 1',
  ROLE_SECRETARIA_2: 'Secretaría 2',
  ROLE_PRESIDENTE: 'Presidente',
  ROLE_CONSEJERO: 'Consejero',
};

export const TIPO_SOLICITUD: Record<TipoSolicitud, string> = {
  ACADEMICA: 'Académica',
  ADMINISTRATIVA: 'Administrativa',
  ESTUDIANTIL: 'Estudiantil',
  DOCENTE: 'Docente',
};

export const ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  RADICADO: 'Radicada',
  DEVUELTO: 'Devuelta',
  RECHAZADO: 'Rechazada',
  APROBADO: 'Aprobada',
  EN_AGENDA: 'En agenda',
  PROCESADO: 'Procesada',
};

export const ESTADO_SESION: Record<EstadoSesion, string> = {
  PROGRAMADA: 'Programada',
  CONVOCADA: 'Convocada',
  INICIADA: 'En curso',
  SUSPENDIDA: 'Suspendida',
  FINALIZADA: 'Finalizada',
};

export const ESTADO_ACTA: Record<EstadoActa, string> = {
  BORRADOR: 'Borrador',
  EN_EDICION: 'En edición',
  PENDIENTE_DE_FIRMA: 'Pendiente de firma',
  PUBLICADA: 'Publicada',
};

export const RESULTADO: Record<ResultadoDecision, string> = {
  APROBADO: 'Aprobado',
  NEGADO: 'Negado',
  APLAZADO: 'Aplazado',
  CANCELADO: 'Cancelado',
};

export const TONE: Record<string, string> = {
  RADICADO: 'info',
  DEVUELTO: 'warn',
  RECHAZADO: 'danger',
  APROBADO: 'ok',
  EN_AGENDA: 'info',
  PROCESADO: 'muted',
  PROGRAMADA: 'info',
  CONVOCADA: 'warn',
  INICIADA: 'ok',
  SUSPENDIDA: 'warn',
  FINALIZADA: 'muted',
  BORRADOR: 'muted',
  EN_EDICION: 'info',
  PENDIENTE_DE_FIRMA: 'warn',
  PUBLICADA: 'ok',
  NEGADO: 'danger',
  APLAZADO: 'warn',
  CANCELADO: 'muted',
  ROLE_ADMIN: 'danger',
  ROLE_DEV: 'info',
  ROLE_SECRETARIA_1: 'ok',
  ROLE_SECRETARIA_2: 'info',
  ROLE_PRESIDENTE: 'warn',
  ROLE_CONSEJERO: 'muted',
};

export function etiquetaRol(rol: string): string {
  return ROL_ETIQUETA[rol] ?? rol.replace('ROLE_', '');
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

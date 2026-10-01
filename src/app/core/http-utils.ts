import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

export function apiMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado';
  }
  const body = err.error as ApiError | string | null;
  if (body && typeof body === 'object' && 'message' in body && body.message) {
    const extra = body.detalles?.length ? ` (${body.detalles.join('; ')})` : '';
    return body.message + extra;
  }
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
    return 'No hay conexión con el servidor SIGAC. Verifique que el backend esté en ejecución en el puerto 8080.';
  }
  if (err.status === 401) {
    return 'Sesión no válida o expirada. Inicie sesión nuevamente';
  }
  if (err.status === 403) {
    return 'No tiene permisos para realizar esta operación';
  }
  return err.status ? `Error ${err.status} al comunicarse con el servidor` : 'Error de red';
}

export function toQuery(params: Record<string, string | number | boolean | null | undefined>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') {
      out[k] = v;
    }
  }
  return out;
}

import { HttpErrorResponse } from '@angular/common/http';
import { I18nService } from '../i18n/i18n.service';
import { ApiError } from './api.models';

export function apiMessage(err: unknown, i18n: I18nService): string {
  if (!(err instanceof HttpErrorResponse)) {
    return i18n.t('errors.unexpected');
  }
  const body = err.error as ApiError | string | null;
  if (body && typeof body === 'object' && 'message' in body && body.message) {
    const extra = body.details?.length ? ` (${body.details.join('; ')})` : '';
    return translateServerMessage(body.message, i18n) + extra;
  }
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
    return i18n.t('errors.offline');
  }
  if (err.status === 401) {
    return i18n.t('errors.unauthorized');
  }
  if (err.status === 403) {
    return i18n.t('errors.forbidden');
  }
  return err.status ? i18n.t('errors.status', { status: err.status }) : i18n.t('errors.network');
}

/** Server texts are fixed in English. Show them in the language selected in the screen. */
function translateServerMessage(message: string, i18n: I18nService): string {
  const attendance = message.match(/^Attendance cannot be recorded with the session in status (\w+)$/);
  if (attendance) {
    const label = i18n.t('enums.sessionStatus.' + attendance[1]);
    const status = label.charAt(0).toLowerCase() + label.slice(1);
    return i18n.t('errors.attendanceClosed', { status });
  }
  return message;
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

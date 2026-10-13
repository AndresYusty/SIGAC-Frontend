import { Injectable, computed, inject, signal } from '@angular/core';
import { apiMessage } from './http-utils';
import { I18nService, TranslationParams } from './i18n.service';

export interface Toast {
  id: number;
  kind: 'ok' | 'error' | 'info';
  text: string;
}

/** Messages are translation keys; `apiError` shows the server message for a failed request. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly i18n = inject(I18nService);
  private readonly itemsSig = signal<Toast[]>([]);
  private seq = 0;
  readonly items = computed(() => this.itemsSig());

  ok(key: string, params?: TranslationParams): void {
    this.push('ok', this.i18n.t(key, params));
  }

  error(key: string, params?: TranslationParams): void {
    this.push('error', this.i18n.t(key, params));
  }

  info(key: string, params?: TranslationParams): void {
    this.push('info', this.i18n.t(key, params));
  }

  apiError(err: unknown): void {
    this.push('error', apiMessage(err, this.i18n));
  }

  dismiss(id: number): void {
    this.itemsSig.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], text: string): void {
    const id = ++this.seq;
    this.itemsSig.update((list) => [...list, { id, kind, text }]);
    window.setTimeout(() => this.dismiss(id), 5200);
  }
}

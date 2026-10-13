import { Injectable, inject, signal } from '@angular/core';
import { I18nService, TranslationParams } from './i18n.service';

/** Title, message and button label are translation keys. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly i18n = inject(I18nService);
  readonly open = signal(false);
  readonly title = signal('');
  readonly message = signal('');
  readonly okLabel = signal('');
  private resolver: ((value: boolean) => void) | null = null;

  ask(titleKey: string, messageKey: string, okKey = 'common.confirm', params?: TranslationParams): Promise<boolean> {
    this.title.set(this.i18n.t(titleKey, params));
    this.message.set(this.i18n.t(messageKey, params));
    this.okLabel.set(this.i18n.t(okKey, params));
    this.open.set(true);
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  close(value: boolean): void {
    this.open.set(false);
    this.resolver?.(value);
    this.resolver = null;
  }
}

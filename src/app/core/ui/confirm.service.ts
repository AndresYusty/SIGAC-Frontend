import { Injectable, inject, signal } from '@angular/core';
import { I18nService, TranslationParams } from '../i18n/i18n.service';

/** Title, message and button label are translation keys. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly i18n = inject(I18nService);
  readonly open = signal(false);
  readonly title = signal('');
  readonly message = signal('');
  readonly okLabel = signal('');
  /** One button, no cancel. Used for a result such as a saved record. */
  readonly single = signal(false);
  readonly success = signal(false);
  /** In progress: no buttons and the backdrop cannot dismiss it. */
  readonly busy = signal(false);
  private resolver: ((value: boolean) => void) | null = null;

  /** Shows a centered message with a single close button. The text is already translated. */
  tell(text: string, success = false, message = ''): void {
    this.busy.set(false);
    this.single.set(true);
    this.success.set(success);
    this.title.set(text);
    this.message.set(message);
    this.okLabel.set(this.i18n.t('common.close'));
    this.open.set(true);
  }

  /** Same as tell(), but title and optional message are translation keys. */
  tellKey(titleKey: string, success = false, messageKey?: string, params?: TranslationParams): void {
    this.tell(this.i18n.t(titleKey, params), success, messageKey ? this.i18n.t(messageKey, params) : '');
  }

  /** Progress modal while a long action (e.g. sending mail) runs. */
  wait(titleKey: string, messageKey?: string, params?: TranslationParams): void {
    this.busy.set(true);
    this.single.set(true);
    this.success.set(false);
    this.title.set(this.i18n.t(titleKey, params));
    this.message.set(messageKey ? this.i18n.t(messageKey, params) : '');
    this.okLabel.set('');
    this.open.set(true);
    this.resolver = null;
  }

  ask(titleKey: string, messageKey: string, okKey = 'common.confirm', params?: TranslationParams): Promise<boolean> {
    this.busy.set(false);
    this.single.set(false);
    this.success.set(false);
    this.title.set(this.i18n.t(titleKey, params));
    this.message.set(this.i18n.t(messageKey, params));
    this.okLabel.set(this.i18n.t(okKey, params));
    this.open.set(true);
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  close(value: boolean): void {
    if (this.busy()) {
      return;
    }
    this.open.set(false);
    this.resolver?.(value);
    this.resolver = null;
  }

  /** Closes a wait modal without resolving an ask() promise (e.g. after an error). */
  dismiss(): void {
    this.busy.set(false);
    this.open.set(false);
    this.resolver = null;
  }
}

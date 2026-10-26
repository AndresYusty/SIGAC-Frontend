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
  private resolver: ((value: boolean) => void) | null = null;

  /** Shows a centered message with a single close button. The text is already translated. */
  tell(text: string, success = false): void {
    this.single.set(true);
    this.success.set(success);
    this.title.set(text);
    this.message.set('');
    this.okLabel.set(this.i18n.t('common.close'));
    this.open.set(true);
  }

  ask(titleKey: string, messageKey: string, okKey = 'common.confirm', params?: TranslationParams): Promise<boolean> {
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
    this.open.set(false);
    this.resolver?.(value);
    this.resolver = null;
  }
}

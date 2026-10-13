import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, TranslationParams } from '@core/i18n/i18n.service';

/** Impure so that templates re-render immediately when the active language changes. */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}

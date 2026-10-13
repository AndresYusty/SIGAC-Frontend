import { Component, inject } from '@angular/core';
import { I18nService } from '../core/i18n.service';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-lang-switch',
  imports: [TranslatePipe],
  template: `
    <div class="lang-switch" role="group" [attr.aria-label]="'lang.label' | t">
      @for (option of i18n.languages; track option) {
        <button
          type="button"
          [class.active]="i18n.lang() === option"
          [attr.aria-pressed]="i18n.lang() === option"
          [attr.title]="'lang.' + option | t"
          (click)="i18n.use(option)"
        >
          {{ option.toUpperCase() }}
        </button>
      }
    </div>
  `,
})
export class LangSwitchComponent {
  readonly i18n = inject(I18nService);
}

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from '@core/i18n/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Instantiated at startup so <html lang> and the document title follow the active language.
  private readonly i18n = inject(I18nService);
}

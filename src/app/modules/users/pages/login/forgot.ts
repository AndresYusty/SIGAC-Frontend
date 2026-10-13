import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { apiMessage } from '@core/http/http-utils';
import { I18nService } from '@core/i18n/i18n.service';
import { LangSwitchComponent } from '@shared/components/lang-switch';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-forgot',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LangSwitchComponent],
  templateUrl: './forgot.html',
})
export class ForgotPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiMessage(err, this.i18n));
      },
    });
  }
}

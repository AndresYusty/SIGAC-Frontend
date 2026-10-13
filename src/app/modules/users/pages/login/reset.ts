import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { apiMessage } from '@core/http/http-utils';
import { I18nService } from '@core/i18n/i18n.service';
import { LangSwitchComponent } from '@shared/components/lang-switch';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LangSwitchComponent],
  templateUrl: './reset.html',
})
export class ResetPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.error.set(this.i18n.t('reset.invalidLink'));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(token, this.form.controls.newPassword.value).subscribe({
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

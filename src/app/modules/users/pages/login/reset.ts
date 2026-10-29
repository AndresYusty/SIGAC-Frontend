import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ApiError } from '@core/http/api.models';
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
  /** success: password saved. invalid: the link cannot be used again. password: the new value was rejected. */
  readonly feedback = signal<'' | 'success' | 'invalid' | 'password'>('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.loading() || this.feedback() === 'success' || this.feedback() === 'invalid') {
      return;
    }
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.error.set('');
      this.feedback.set('invalid');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.feedback.set('');
    this.auth.resetPassword(token, this.form.controls.newPassword.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.set('success');
      },
      error: (err) => {
        this.loading.set(false);
        const message = serverMessage(err);
        if (message === 'The recovery link is invalid or has already been used') {
          this.feedback.set('invalid');
          return;
        }
        if (message === 'The password must be at least 8 characters long and include letters and numbers') {
          this.feedback.set('password');
          return;
        }
        this.error.set(apiMessage(err, this.i18n));
      },
    });
  }
}

function serverMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return '';
  }
  const body = err.error as ApiError | null;
  return body && typeof body === 'object' && body.message ? body.message : '';
}

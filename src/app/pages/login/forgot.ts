import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiMessage } from '../../core/http-utils';

@Component({
  selector: 'app-forgot',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot.html',
})
export class ForgotPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ok = signal('');
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
    this.auth.forgot(this.form.controls.email.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.ok.set(res.mensaje);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiMessage(err));
      },
    });
  }
}

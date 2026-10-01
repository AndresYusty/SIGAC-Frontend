import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiMessage } from '../../core/http-utils';

@Component({
  selector: 'app-reset',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset.html',
})
export class ResetPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ok = signal('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    nuevaClave: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.error.set('El enlace de recuperación no es válido.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.reset(token, this.form.controls.nuevaClave.value).subscribe({
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

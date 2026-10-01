import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { apiMessage } from '../../core/http-utils';
import { etiquetaRol } from '../../core/labels';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './perfil.html',
})
export class PerfilPage {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly etiquetaRol = etiquetaRol;
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    claveActual: ['', Validators.required],
    claveNueva: ['', [Validators.required, Validators.minLength(8)]],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.auth.changePassword(v.claveActual, v.claveNueva).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.form.reset();
        this.toast.ok(r.mensaje);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(apiMessage(e));
      },
    });
  }
}

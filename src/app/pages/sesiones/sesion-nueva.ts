import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { TipoConsejoDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-sesion-nueva',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sesion-nueva.html',
})
export class SesionNuevaPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly tipos = signal<TipoConsejoDto[]>([]);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    tipoConsejoId: [0, Validators.required],
    fechaProgramada: ['', Validators.required],
    lugar: ['', Validators.required],
  });

  ngOnInit(): void {
    this.api.tiposConsejo().subscribe({
      next: (t) => {
        this.tipos.set(t);
        if (t[0]) {
          this.form.patchValue({ tipoConsejoId: t[0].id });
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.crearSesion(Number(v.tipoConsejoId), v.fechaProgramada, v.lugar).subscribe({
      next: (s) => {
        this.toast.ok('Sesión programada');
        void this.router.navigate(['/sesiones', s.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(apiMessage(e));
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { NodoDto, TipoSolicitud } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-solicitud-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './solicitud-form.html',
})
export class SolicitudFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = signal<number | null>(null);
  readonly programas = signal<NodoDto[]>([]);
  readonly files = signal<File[]>([]);
  readonly saving = signal(false);
  readonly tipos: TipoSolicitud[] = ['ACADEMICA', 'ADMINISTRATIVA', 'ESTUDIANTIL', 'DOCENTE'];

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: ['', [Validators.required, Validators.maxLength(4000)]],
    solicitante: ['', [Validators.required, Validators.maxLength(150)]],
    tipoSolicitud: ['ACADEMICA' as TipoSolicitud, Validators.required],
    programaId: ['' as string | number],
  });

  ngOnInit(): void {
    this.api.universidades().subscribe({
      next: (unis) => {
        const u = unis[0];
        if (!u) return;
        this.api.sedes(u.id).subscribe((sedes) => {
          const sede = sedes[0];
          if (!sede) return;
          this.api.facultades(sede.id).subscribe((facs) => {
            const fac = facs[0];
            if (!fac) return;
            this.api.programas(fac.id).subscribe((p) => this.programas.set(p));
          });
        });
      },
    });
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw && raw !== 'nueva') {
      const id = Number(raw);
      this.id.set(id);
      this.api.solicitud(id).subscribe({
        next: (s) => {
          this.form.patchValue({
            titulo: s.titulo,
            descripcion: s.descripcion,
            solicitante: s.solicitante,
            tipoSolicitud: s.tipoSolicitud,
            programaId: s.programaId ?? '',
          });
        },
        error: (e) => this.toast.error(apiMessage(e)),
      });
    }
  }

  onFiles(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.files.set(Array.from(input.files ?? []));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('titulo', v.titulo);
    fd.append('descripcion', v.descripcion);
    fd.append('solicitante', v.solicitante);
    fd.append('tipoSolicitud', v.tipoSolicitud);
    if (v.programaId) {
      fd.append('programaId', String(v.programaId));
    }
    for (const f of this.files()) {
      fd.append('anexos', f, f.name);
    }
    this.saving.set(true);
    const id = this.id();
    const req = id ? this.api.actualizarSolicitud(id, fd) : this.api.radicarSolicitud(fd);
    req.subscribe({
      next: (s) => {
        this.toast.ok(id ? 'Solicitud actualizada' : 'Solicitud radicada');
        void this.router.navigate(['/solicitudes', s.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(apiMessage(e));
      },
    });
  }
}

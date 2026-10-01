import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { apiMessage } from '../../core/http-utils';
import { etiquetaRol } from '../../core/labels';
import { NodoDto, Page, ROLES, UsuarioDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
})
export class UsuariosPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly page = signal<Page<UsuarioDto> | null>(null);
  readonly facultades = signal<NodoDto[]>([]);
  readonly programas = signal<NodoDto[]>([]);
  readonly editing = signal<UsuarioDto | null>(null);
  readonly roles = ROLES;
  readonly etiquetaRol = etiquetaRol;
  q = '';
  showForm = false;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rol: ['ROLE_CONSEJERO', Validators.required],
    facultadId: ['' as string | number],
    programaId: ['' as string | number],
  });

  ngOnInit(): void {
    this.load();
    this.api.universidades().subscribe({
      next: (unis) => {
        const u = unis[0];
        if (!u) return;
        this.api.sedes(u.id).subscribe((sedes) => {
          const sede = sedes[0];
          if (!sede) return;
          this.api.facultades(sede.id).subscribe((f) => this.facultades.set(f));
        });
      },
    });
  }

  loadFacultadProgramas(): void {
    const id = Number(this.form.controls.facultadId.value);
    if (!id) {
      this.programas.set([]);
      return;
    }
    this.api.programas(id).subscribe({ next: (p) => this.programas.set(p) });
  }

  load(n = 0): void {
    this.api.listUsers(this.q, n).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  search(ev: Event): void {
    this.q = (ev.target as HTMLInputElement).value;
    this.load();
  }

  nuevo(): void {
    this.editing.set(null);
    this.form.reset({ nombre: '', email: '', password: '', rol: 'ROLE_CONSEJERO', facultadId: '', programaId: '' });
    this.showForm = true;
  }

  editar(u: UsuarioDto): void {
    this.editing.set(u);
    this.form.patchValue({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.roles[0] ?? 'ROLE_CONSEJERO',
      facultadId: u.facultadId ?? '',
      programaId: u.programaId ?? '',
    });
    this.loadFacultadProgramas();
    this.showForm = true;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const facultadId = v.facultadId ? Number(v.facultadId) : null;
    const programaId = v.programaId ? Number(v.programaId) : null;
    const current = this.editing();
    if (current) {
      this.api.updateUser(current.id, { nombre: v.nombre, roles: [v.rol], facultadId, programaId }).subscribe({
        next: () => {
          this.toast.ok('Usuario actualizado');
          this.showForm = false;
          this.load(this.page()?.number ?? 0);
        },
        error: (e) => this.toast.error(apiMessage(e)),
      });
    } else {
      if (!v.password) {
        this.toast.error('La contraseña es obligatoria');
        return;
      }
      this.api
        .createUser({ nombre: v.nombre, email: v.email, password: v.password, roles: [v.rol], facultadId, programaId })
        .subscribe({
          next: () => {
            this.toast.ok('Usuario creado');
            this.showForm = false;
            this.load();
          },
          error: (e) => this.toast.error(apiMessage(e)),
        });
    }
  }

  async toggle(u: UsuarioDto): Promise<void> {
    const ok = await this.confirm.ask(
      u.activo ? 'Desactivar usuario' : 'Activar usuario',
      `¿Confirma cambiar el estado de ${u.nombre}?`,
      u.activo ? 'Desactivar' : 'Activar',
    );
    if (!ok) return;
    this.api.setUserActive(u.id, !u.activo).subscribe({
      next: () => {
        this.toast.ok('Estado actualizado');
        this.load(this.page()?.number ?? 0);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

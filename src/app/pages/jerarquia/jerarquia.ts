import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { NodoDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-jerarquia',
  imports: [FormsModule],
  templateUrl: './jerarquia.html',
})
export class JerarquiaPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly unis = signal<NodoDto[]>([]);
  readonly sedes = signal<NodoDto[]>([]);
  readonly facs = signal<NodoDto[]>([]);
  readonly progs = signal<NodoDto[]>([]);
  uni?: number;
  sede?: number;
  fac?: number;
  uniNombre = '';
  sedeNombre = '';
  sedeCiudad = '';
  facNombre = '';
  progNombre = '';

  ngOnInit(): void {
    this.loadUnis();
  }

  loadUnis(): void {
    this.api.universidades().subscribe({
      next: (u) => {
        this.unis.set(u);
        if (!this.uni && u[0]) this.selectUni(u[0].id);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  selectUni(id: number): void {
    this.uni = id;
    this.sede = undefined;
    this.fac = undefined;
    this.facs.set([]);
    this.progs.set([]);
    this.api.sedes(id).subscribe({ next: (s) => this.sedes.set(s) });
  }

  selectSede(id: number): void {
    this.sede = id;
    this.fac = undefined;
    this.progs.set([]);
    this.api.facultades(id).subscribe({ next: (f) => this.facs.set(f) });
  }

  selectFac(id: number): void {
    this.fac = id;
    this.api.programas(id).subscribe({ next: (p) => this.progs.set(p) });
  }

  crearUni(): void {
    this.api.crearUniversidad(this.uniNombre).subscribe({
      next: () => {
        this.uniNombre = '';
        this.loadUnis();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  crearSede(): void {
    if (!this.uni) return;
    this.api.crearSede(this.sedeNombre, this.sedeCiudad, this.uni).subscribe({
      next: () => {
        this.sedeNombre = '';
        this.sedeCiudad = '';
        this.selectUni(this.uni!);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  crearFac(): void {
    if (!this.sede) return;
    this.api.crearFacultad(this.facNombre, this.sede).subscribe({
      next: () => {
        this.facNombre = '';
        this.selectSede(this.sede!);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  crearProg(): void {
    if (!this.fac) return;
    this.api.crearPrograma(this.progNombre, this.fac).subscribe({
      next: () => {
        this.progNombre = '';
        this.selectFac(this.fac!);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

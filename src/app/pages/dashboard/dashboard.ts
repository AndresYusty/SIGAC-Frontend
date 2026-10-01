import { DatePipe, KeyValuePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { apiMessage } from '../../core/http-utils';
import { etiquetaRol, ESTADO_SOLICITUD } from '../../core/labels';
import { ActaPublicadaResumen, DashboardDto, EstadoSolicitud } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, KeyValuePipe],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly data = signal<DashboardDto | null>(null);
  readonly etiquetaRol = etiquetaRol;
  readonly estadoSol = ESTADO_SOLICITUD;

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  num(key: string): number | null {
    const v = this.data()?.indicadores?.[key];
    return typeof v === 'number' ? v : null;
  }

  map(key: string): Record<string, number> | null {
    const v = this.data()?.indicadores?.[key];
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, number>) : null;
  }

  actas(): ActaPublicadaResumen[] {
    const v = this.data()?.indicadores?.['ultimasActasPublicadas'];
    return Array.isArray(v) ? (v as ActaPublicadaResumen[]) : [];
  }

  etiquetaEstado(key: string): string {
    return this.estadoSol[key as EstadoSolicitud] ?? key;
  }
}

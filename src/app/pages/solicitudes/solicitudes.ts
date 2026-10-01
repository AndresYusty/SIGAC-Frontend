import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { apiMessage } from '../../core/http-utils';
import { ESTADO_SOLICITUD, TONE, TIPO_SOLICITUD } from '../../core/labels';
import { EstadoSolicitud, Page, SolicitudDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-solicitudes',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './solicitudes.html',
})
export class SolicitudesPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly estados = Object.keys(ESTADO_SOLICITUD) as EstadoSolicitud[];
  readonly etiqueta = ESTADO_SOLICITUD;
  readonly tipo = TIPO_SOLICITUD;
  readonly tone = TONE;
  estado: EstadoSolicitud | '' = '';
  codigo = '';
  desde = '';
  hasta = '';
  readonly page = signal<Page<SolicitudDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.buscarSolicitudes({ estado: this.estado, codigo: this.codigo, desde: this.desde, hasta: this.hasta, page: n, size: 20 }).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

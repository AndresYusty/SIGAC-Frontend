import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { saveBlob } from '../../core/files';
import { apiMessage } from '../../core/http-utils';
import { bytes, ESTADO_SOLICITUD, TONE, TIPO_SOLICITUD } from '../../core/labels';
import { HistorialDto, SolicitudDto } from '../../core/models';
import { ConfirmService } from '../../core/confirm.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-solicitud-detalle',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './solicitud-detalle.html',
})
export class SolicitudDetallePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly s = signal<SolicitudDto | null>(null);
  readonly hist = signal<HistorialDto[]>([]);
  motivo = '';
  readonly etiqueta = ESTADO_SOLICITUD;
  readonly tipo = TIPO_SOLICITUD;
  readonly tone = TONE;
  readonly bytes = bytes;

  ngOnInit(): void {
    this.reload();
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    const id = this.id();
    this.api.solicitud(id).subscribe({
      next: (s) => this.s.set(s),
      error: (e) => this.toast.error(apiMessage(e)),
    });
    this.api.historialSolicitud(id).subscribe({
      next: (h) => this.hist.set(h),
      error: () => undefined,
    });
  }

  descargar(anexoId: number, nombre: string): void {
    this.api.descargarAnexo(this.id(), anexoId).subscribe({
      next: (b) => saveBlob(b, nombre),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  async aprobar(): Promise<void> {
    if (!(await this.confirm.ask('Aprobar solicitud', 'La solicitud quedará lista para incluirse en una agenda.', 'Aprobar'))) return;
    this.api.aprobarSolicitud(this.id()).subscribe({
      next: (s) => {
        this.s.set(s);
        this.toast.ok('Solicitud aprobada');
        this.reload();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  rechazar(): void {
    if (!this.motivo.trim()) {
      this.toast.error('Indique el motivo');
      return;
    }
    this.api.rechazarSolicitud(this.id(), this.motivo).subscribe({
      next: (s) => {
        this.s.set(s);
        this.toast.ok('Solicitud rechazada');
        this.reload();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  devolver(): void {
    if (!this.motivo.trim()) {
      this.toast.error('Indique el motivo');
      return;
    }
    this.api.devolverSolicitud(this.id(), this.motivo).subscribe({
      next: (s) => {
        this.s.set(s);
        this.toast.ok('Solicitud devuelta');
        this.reload();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

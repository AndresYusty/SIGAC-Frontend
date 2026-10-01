import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { saveBlob } from '../../core/files';
import { apiMessage } from '../../core/http-utils';
import { ESTADO_SESION, TONE } from '../../core/labels';
import { SesionDto, SolicitudDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-sesion-detalle',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './sesion-detalle.html',
})
export class SesionDetallePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly sesion = signal<SesionDto | null>(null);
  readonly aprobadas = signal<SolicitudDto[]>([]);
  solicitudId: number | null = null;
  readonly etiqueta = ESTADO_SESION;
  readonly tone = TONE;

  ngOnInit(): void {
    this.reload();
    this.api.buscarSolicitudes({ estado: 'APROBADO', size: 50 }).subscribe({
      next: (p) => this.aprobadas.set(p.content),
      error: () => undefined,
    });
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    this.api.sesion(this.id()).subscribe({
      next: (s) => this.sesion.set(s),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  agregar(): void {
    if (!this.solicitudId) {
      this.toast.error('Seleccione una solicitud aprobada');
      return;
    }
    this.api.agregarPunto(this.id(), this.solicitudId).subscribe({
      next: (s) => {
        this.sesion.set(s);
        this.toast.ok('Punto agregado');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  quitar(puntoId: number): void {
    this.api.quitarPunto(this.id(), puntoId).subscribe({
      next: (s) => this.sesion.set(s),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  mover(index: number, dir: -1 | 1): void {
    const puntos = [...(this.sesion()?.puntos ?? [])];
    const dest = index + dir;
    if (dest < 0 || dest >= puntos.length) return;
    const tmp = puntos[index];
    puntos[index] = puntos[dest];
    puntos[dest] = tmp;
    this.api.reordenarPuntos(this.id(), puntos.map((p) => p.id)).subscribe({
      next: (s) => this.sesion.set(s),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  async cerrar(): Promise<void> {
    if (!(await this.confirm.ask('Cerrar agenda', 'Se generará la citación y se enviará a los integrantes.', 'Cerrar agenda'))) return;
    this.api.cerrarAgenda(this.id()).subscribe({
      next: (s) => {
        this.sesion.set(s);
        this.toast.ok('Agenda cerrada y citación enviada');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  citacion(): void {
    this.api.citacion(this.id()).subscribe({
      next: (b) => saveBlob(b, `citacion-sesion-${this.id()}.pdf`),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  async generarActa(): Promise<void> {
    if (!(await this.confirm.ask('Generar acta', 'Se compilará el acta a partir de la sesión finalizada.', 'Generar'))) return;
    this.api.generarActa(this.id()).subscribe({
      next: (a) => {
        this.toast.ok('Acta generada');
        void this.router.navigate(['/actas', a.id]);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

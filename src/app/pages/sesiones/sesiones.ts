import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { apiMessage } from '../../core/http-utils';
import { ESTADO_SESION, TONE } from '../../core/labels';
import { EstadoSesion, Page, SesionResumenDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-sesiones',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './sesiones.html',
})
export class SesionesPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly estados = Object.keys(ESTADO_SESION) as EstadoSesion[];
  readonly etiqueta = ESTADO_SESION;
  readonly tone = TONE;
  estado: EstadoSesion | '' = '';
  readonly page = signal<Page<SesionResumenDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.listarSesiones(this.estado, n).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

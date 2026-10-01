import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { apiMessage } from '../../core/http-utils';
import { ESTADO_SESION, RESULTADO, TONE } from '../../core/labels';
import { AsistenciaDto, PuntoDto, ResultadoDecision, SesionDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-sesion-vivo',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './sesion-vivo.html',
})
export class SesionVivoPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly sesion = signal<SesionDto | null>(null);
  readonly asis = signal<AsistenciaDto | null>(null);
  readonly etiqueta = ESTADO_SESION;
  readonly tone = TONE;
  readonly resultados = Object.keys(RESULTADO) as ResultadoDecision[];
  readonly resLabel = RESULTADO;
  nota = '';
  varioTitulo = '';
  varioDesc = '';
  decision: Record<number, { resultado: ResultadoDecision; votosFavor: number; votosContra: number; abstenciones: number }> = {};
  private timer?: number;

  ngOnInit(): void {
    this.reload();
    this.timer = window.setInterval(() => this.reload(true), 12000);
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(silent = false): void {
    this.api.sesion(this.id()).subscribe({
      next: (s) => {
        this.sesion.set(s);
        for (const p of s.puntos) {
          this.decision[p.id] ??= {
            resultado: p.resultado ?? 'APROBADO',
            votosFavor: p.votosFavor,
            votosContra: p.votosContra,
            abstenciones: p.abstenciones,
          };
        }
      },
      error: (e) => {
        if (!silent) this.toast.error(apiMessage(e));
      },
    });
    this.api.asistencia(this.id()).subscribe({
      next: (a) => this.asis.set(a),
      error: () => undefined,
    });
  }

  guardarAsistencia(): void {
    const items = (this.asis()?.asistentes ?? []).map((a) => ({ usuarioId: a.usuarioId, presente: a.presente }));
    this.api.registrarAsistencia(this.id(), items).subscribe({
      next: (a) => {
        this.asis.set(a);
        this.toast.ok('Asistencia registrada');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  act(kind: 'iniciar' | 'suspender' | 'reanudar' | 'finalizar'): void {
    const call = {
      iniciar: () => this.api.iniciarSesion(this.id()),
      suspender: () => this.api.suspenderSesion(this.id()),
      reanudar: () => this.api.reanudarSesion(this.id()),
      finalizar: () => this.api.finalizarSesion(this.id()),
    }[kind];
    call().subscribe({
      next: (s) => {
        this.sesion.set(s);
        this.reload();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  registrar(p: PuntoDto): void {
    const d = this.decision[p.id];
    this.api.decision(this.id(), p.id, d).subscribe({
      next: () => {
        this.toast.ok('Decisión registrada');
        this.reload();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  agregarNota(p: PuntoDto): void {
    if (!this.nota.trim()) return;
    this.api.nota(this.id(), p.id, this.nota).subscribe({
      next: () => {
        this.nota = '';
        this.reload();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  agregarVario(): void {
    if (!this.varioTitulo.trim()) return;
    this.api.puntoVario(this.id(), this.varioTitulo, this.varioDesc).subscribe({
      next: (s) => {
        this.sesion.set(s);
        this.varioTitulo = '';
        this.varioDesc = '';
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  async finalizar(): Promise<void> {
    if (!(await this.confirm.ask('Finalizar sesión', 'No podrá registrar más decisiones después de finalizar.', 'Finalizar'))) return;
    this.act('finalizar');
  }
}

import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { blobUrl } from '../../core/files';
import { apiMessage } from '../../core/http-utils';
import { ESTADO_ACTA, TONE } from '../../core/labels';
import { ActaDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-acta-detalle',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './acta-detalle.html',
})
export class ActaDetallePage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly acta = signal<ActaDto | null>(null);
  contenido = '';
  observacion = '';
  pdf?: SafeResourceUrl;
  private rawPdf?: string;
  readonly etiqueta = ESTADO_ACTA;
  readonly tone = TONE;

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  html(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.contenido || '');
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    this.api.acta(this.id()).subscribe({
      next: (a) => {
        this.acta.set(a);
        this.contenido = a.contenidoHtml ?? '';
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  guardar(): void {
    this.api.editarActa(this.id(), this.contenido).subscribe({
      next: (a) => {
        this.acta.set(a);
        this.toast.ok('Contenido guardado');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  vista(): void {
    this.api.vistaPreviaActa(this.id()).subscribe({
      next: (b) => {
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  async enviar(): Promise<void> {
    if (!(await this.confirm.ask('Enviar a firma', 'El acta pasará a pendiente de firma.', 'Enviar'))) return;
    this.api.enviarAFirma(this.id()).subscribe({
      next: (a) => {
        this.acta.set(a);
        this.toast.ok('Enviada a firma');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  async firmar(): Promise<void> {
    if (!(await this.confirm.ask('Aprobar y firmar', 'Una firma publica el acta y la congela.', 'Firmar'))) return;
    this.api.firmarActa(this.id()).subscribe({
      next: (a) => {
        this.acta.set(a);
        this.toast.ok('Acta firmada y publicada');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  devolver(): void {
    if (!this.observacion.trim()) {
      this.toast.error('Indique la observación');
      return;
    }
    this.api.rechazarActa(this.id(), this.observacion).subscribe({
      next: (a) => {
        this.acta.set(a);
        this.toast.ok('Acta devuelta a edición');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

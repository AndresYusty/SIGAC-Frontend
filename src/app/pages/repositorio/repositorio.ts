import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { blobUrl, saveBlob } from '../../core/files';
import { apiMessage } from '../../core/http-utils';
import { Page, RepositorioActaDto, TipoConsejoDto, VerificacionDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-repositorio',
  imports: [FormsModule, DatePipe],
  templateUrl: './repositorio.html',
})
export class RepositorioPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  consecutivo = '';
  texto = '';
  tipoConsejoId: number | '' = '';
  desde = '';
  hasta = '';
  readonly tipos = signal<TipoConsejoDto[]>([]);
  readonly page = signal<Page<RepositorioActaDto> | null>(null);
  readonly verif = signal<VerificacionDto | null>(null);
  pdf?: SafeResourceUrl;
  private rawPdf?: string;

  ngOnInit(): void {
    this.api.tiposConsejo().subscribe({ next: (t) => this.tipos.set(t) });
    this.load();
  }

  ngOnDestroy(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  load(n = 0): void {
    this.api
      .repositorio({
        consecutivo: this.consecutivo,
        texto: this.texto,
        tipoConsejoId: this.tipoConsejoId,
        desde: this.desde,
        hasta: this.hasta,
        page: n,
      })
      .subscribe({
        next: (p) => this.page.set(p),
        error: (e) => this.toast.error(apiMessage(e)),
      });
  }

  verificar(id: number): void {
    this.api.verificarActa(id).subscribe({
      next: (v) => this.verif.set(v),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  ver(id: number): void {
    this.api.visorActa(id).subscribe({
      next: (b) => {
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf);
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  descargar(id: number, consecutivo: string): void {
    this.api.descargarActa(id).subscribe({
      next: (b) => saveBlob(b, `${consecutivo}.pdf`),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

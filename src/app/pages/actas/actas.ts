import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { ESTADO_ACTA, TONE } from '../../core/labels';
import { ActaDto, EstadoActa, Page } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-actas',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './actas.html',
})
export class ActasPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly estados = Object.keys(ESTADO_ACTA) as EstadoActa[];
  readonly etiqueta = ESTADO_ACTA;
  readonly tone = TONE;
  estado: EstadoActa | '' = '';
  readonly page = signal<Page<ActaDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.listarActas(this.estado, n).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { AuditLogDto, Page } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-auditoria',
  imports: [FormsModule, DatePipe],
  templateUrl: './auditoria.html',
})
export class AuditoriaPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  evento = '';
  usuario = '';
  readonly page = signal<Page<AuditLogDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.auditoria({ evento: this.evento, usuario: this.usuario, page: n, size: 50 }).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

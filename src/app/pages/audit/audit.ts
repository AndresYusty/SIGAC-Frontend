import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { LocalDatePipe } from '../../core/local-date.pipe';
import { AuditLogDto, Page } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-audit',
  imports: [FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './audit.html',
})
export class AuditPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  event = '';
  user = '';
  readonly page = signal<Page<AuditLogDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.searchAudit({ event: this.event, user: this.user, page: n, size: 50 }).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.apiError(e),
    });
  }
}

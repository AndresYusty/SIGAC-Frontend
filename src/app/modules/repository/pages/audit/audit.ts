import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '@core/http/api.models';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { LiveQuery } from '@shared/utils/live-query';
import { RepositoryApi } from '../../repository.api';
import { AuditLogDto } from '../../repository.models';

@Component({
  selector: 'app-audit',
  imports: [FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './audit.html',
})
export class AuditPage implements OnInit, OnDestroy {
  private readonly api = inject(RepositoryApi);
  private readonly toast = inject(ToastService);
  event = '';
  user = '';
  readonly page = signal<Page<AuditLogDto> | null>(null);
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.query.cancel();
  }

  applyText(): void {
    this.query.typed(() => this.load());
  }

  load(n = 0): void {
    const id = this.query.begin();
    this.api.searchAudit({ event: this.event, user: this.user, page: n, size: 50 }).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

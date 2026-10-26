import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Page } from '@core/http/api.models';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TONE } from '@shared/utils/labels';
import { LiveQuery } from '@shared/utils/live-query';
import { RequestsApi } from '../../requests.api';
import { REQUEST_STATUSES, RequestDto, RequestStatus } from '../../requests.models';

@Component({
  selector: 'app-requests',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './requests.html',
})
export class RequestsPage implements OnInit, OnDestroy {
  private readonly api = inject(RequestsApi);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly statuses = REQUEST_STATUSES;
  readonly tone = TONE;
  status: RequestStatus | '' | 'PENDING' = this.auth.has('ROLE_COUNCIL_SECRETARY') ? 'PENDING' : '';
  code = '';
  from = '';
  to = '';
  readonly page = signal<Page<RequestDto> | null>(null);
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.query.cancel();
  }

  async remove(request: RequestDto): Promise<void> {
    if (!(await this.confirm.ask('records.deleteTitle', 'records.deleteRequest', 'records.remove', { code: request.code }))) return;
    this.api.deleteRequest(request.id).subscribe({
      next: () => {
        this.toast.ok('records.deleted');
        this.load(this.page()?.number ?? 0);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  apply(): void {
    this.query.immediate(() => this.load());
  }

  applyText(): void {
    this.query.typed(() => this.load());
  }

  load(n = 0): void {
    const id = this.query.begin();
    const pending = this.status === 'PENDING';
    this.api.searchRequests({
      status: pending ? undefined : (this.status as RequestStatus | ''),
      pending,
      code: this.code,
      from: this.from,
      to: this.to,
      page: n,
      size: 20,
    }).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

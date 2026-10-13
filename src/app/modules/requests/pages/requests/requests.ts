import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Page } from '@core/http/api.models';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TONE } from '@shared/utils/labels';
import { RequestsApi } from '../../requests.api';
import { REQUEST_STATUSES, RequestDto, RequestStatus } from '../../requests.models';

@Component({
  selector: 'app-requests',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './requests.html',
})
export class RequestsPage implements OnInit {
  private readonly api = inject(RequestsApi);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly statuses = REQUEST_STATUSES;
  readonly tone = TONE;
  status: RequestStatus | '' = '';
  code = '';
  from = '';
  to = '';
  readonly page = signal<Page<RequestDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.searchRequests({ status: this.status, code: this.code, from: this.from, to: this.to, page: n, size: 20 }).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.apiError(e),
    });
  }
}

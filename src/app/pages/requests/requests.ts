import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TONE } from '../../core/labels';
import { LocalDatePipe } from '../../core/local-date.pipe';
import { Page, REQUEST_STATUSES, RequestDto, RequestStatus } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-requests',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './requests.html',
})
export class RequestsPage implements OnInit {
  private readonly api = inject(ApiService);
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

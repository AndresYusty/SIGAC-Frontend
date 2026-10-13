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
import { SESSION_STATUSES, SessionStatus, SessionSummaryDto } from '../../requests.models';

@Component({
  selector: 'app-sessions',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './sessions.html',
})
export class SessionsPage implements OnInit {
  private readonly api = inject(RequestsApi);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly statuses = SESSION_STATUSES;
  readonly tone = TONE;
  status: SessionStatus | '' = '';
  readonly page = signal<Page<SessionSummaryDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.listSessions(this.status, n).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.apiError(e),
    });
  }
}

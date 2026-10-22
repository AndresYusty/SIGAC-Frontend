import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Page } from '@core/http/api.models';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TONE } from '@shared/utils/labels';
import { LiveQuery } from '@shared/utils/live-query';
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
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.load();
  }

  apply(): void {
    this.query.immediate(() => this.load());
  }

  load(n = 0): void {
    const id = this.query.begin();
    this.api.listSessions(this.status, n).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

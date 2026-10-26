import { Component, inject, OnInit, signal } from '@angular/core';
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
import { SESSION_STATUSES, SessionStatus, SessionSummaryDto } from '../../requests.models';

type SessionSort = 'type' | 'faculty' | 'date' | 'location' | 'status' | 'items';

@Component({
  selector: 'app-sessions',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './sessions.html',
})
export class SessionsPage implements OnInit {
  private readonly api = inject(RequestsApi);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly statuses = SESSION_STATUSES;
  readonly tone = TONE;
  status: SessionStatus | '' = '';
  readonly sortKey = signal<SessionSort | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal<Page<SessionSummaryDto> | null>(null);
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.load();
  }

  async remove(session: SessionSummaryDto): Promise<void> {
    const label = `${session.councilType} · ${session.location || ''}`;
    if (!(await this.confirm.ask('records.deleteTitle', 'records.deleteSession', 'records.remove', { code: label }))) return;
    this.api.deleteSession(session.id).subscribe({
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

  mark(key: SessionSort): string {
    return this.sortKey() === key && this.sortDir() === 'desc' ? '↓' : '↑';
  }

  aria(key: SessionSort): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  sortBy(key: SessionSort): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.apply();
  }

  load(n = 0): void {
    const id = this.query.begin();
    const key = this.sortKey();
    const sort = key ? `${key},${this.sortDir()}` : undefined;
    this.api.listSessions(this.status, n, 20, sort).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { RepositoryApi } from '../../repository.api';
import { DashboardDto, DashboardIndicators } from '../../repository.models';

type CountKey = {
  [K in keyof DashboardIndicators]-?: DashboardIndicators[K] extends number | undefined ? K : never;
}[keyof DashboardIndicators];

interface DeskLink {
  key: CountKey;
  path: string;
}

const PENDING: DeskLink[] = [
  { key: 'requestsPendingReview', path: '/requests' },
  { key: 'approvedRequestsWithoutAgenda', path: '/sessions' },
  { key: 'upcomingSessions', path: '/sessions' },
  { key: 'minutesInProgress', path: '/minutes' },
  { key: 'minutesPendingSignature', path: '/minutes' },
];

const RECORD: DeskLink[] = [
  { key: 'finishedSessions', path: '/sessions' },
  { key: 'publishedMinutesTotal', path: '/repository' },
  { key: 'activeUsers', path: '/users' },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, KeyValuePipe, LocalDatePipe, TranslatePipe],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(RepositoryApi);
  private readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly data = signal<DashboardDto | null>(null);

  readonly today = computed(() => {
    const locale = this.i18n.locale();
    const now = new Date();
    return {
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now),
      day: new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(now),
      rest: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(now),
    };
  });

  readonly pending = computed(() => this.pick(PENDING, true));
  readonly record = computed(() => this.pick(RECORD, false));
  readonly byStatus = computed(() => this.data()?.indicators.myRequestsByStatus ?? null);
  readonly latestMinutes = computed(() => this.data()?.indicators.latestPublishedMinutes ?? []);

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.toast.apiError(e),
    });
  }

  private pick(links: DeskLink[], onlyPending: boolean): { key: CountKey; value: number; path: string }[] {
    const indicators = this.data()?.indicators;
    if (!indicators) {
      return [];
    }
    return links.flatMap((link) => {
      const value = indicators[link.key];
      if (typeof value !== 'number' || (onlyPending && value === 0)) {
        return [];
      }
      return [{ ...link, value }];
    });
  }
}

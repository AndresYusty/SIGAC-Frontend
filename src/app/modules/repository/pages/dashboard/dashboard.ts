import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { RepositoryApi } from '../../repository.api';
import { DashboardDto, DashboardIndicators } from '../../repository.models';

type CountKey = {
  [K in keyof DashboardIndicators]-?: DashboardIndicators[K] extends number | undefined ? K : never;
}[keyof DashboardIndicators];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, KeyValuePipe, LocalDatePipe, TranslatePipe],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(RepositoryApi);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly data = signal<DashboardDto | null>(null);

  readonly countKeys: CountKey[] = [
    'requestsPendingReview',
    'approvedRequestsWithoutAgenda',
    'upcomingSessions',
    'minutesInProgress',
    'minutesPendingSignature',
    'finishedSessions',
    'activeUsers',
    'publishedMinutesTotal',
  ];

  readonly stats = computed(() => {
    const ind = this.data()?.indicators;
    return ind ? this.countKeys.filter((k) => typeof ind[k] === 'number').map((k) => ({ key: k, value: ind[k] as number })) : [];
  });
  readonly byStatus = computed(() => this.data()?.indicators.myRequestsByStatus ?? null);
  readonly latestMinutes = computed(() => this.data()?.indicators.latestPublishedMinutes ?? []);

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.toast.apiError(e),
    });
  }
}

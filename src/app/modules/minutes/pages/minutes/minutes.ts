import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Page } from '@core/http/api.models';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TONE } from '@shared/utils/labels';
import { LiveQuery } from '@shared/utils/live-query';
import { MinutesApi } from '../../minutes.api';
import { MINUTES_STATUSES, MinutesDto, MinutesStatus } from '../../minutes.models';

@Component({
  selector: 'app-minutes',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './minutes.html',
})
export class MinutesPage implements OnInit {
  private readonly api = inject(MinutesApi);
  private readonly toast = inject(ToastService);
  readonly statuses = MINUTES_STATUSES;
  readonly tone = TONE;
  status: MinutesStatus | '' = '';
  readonly page = signal<Page<MinutesDto> | null>(null);
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.load();
  }

  apply(): void {
    this.query.immediate(() => this.load());
  }

  load(n = 0): void {
    const id = this.query.begin();
    this.api.listMinutes(this.status, n).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Page } from '@core/http/api.models';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { LiveQuery } from '@shared/utils/live-query';
import { MinutesApi } from '../../minutes.api';
import { MinutesDto } from '../../minutes.models';

@Component({
  selector: 'app-minutes',
  imports: [RouterLink, LocalDatePipe, TranslatePipe],
  templateUrl: './minutes.html',
})
export class MinutesPage implements OnInit {
  private readonly api = inject(MinutesApi);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly page = signal<Page<MinutesDto> | null>(null);
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.load();
  }

  async remove(minutes: MinutesDto): Promise<void> {
    if (!(await this.confirm.ask('records.deleteTitle', 'records.deleteMinutes', 'records.remove', { code: minutes.serialNumber }))) return;
    this.api.deleteMinutes(minutes.id).subscribe({
      next: () => {
        this.toast.ok('records.deleted');
        this.load(this.page()?.number ?? 0);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  load(n = 0): void {
    const id = this.query.begin();
    this.api.listMinutes('', n).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TONE } from '../../core/labels';
import { LocalDatePipe } from '../../core/local-date.pipe';
import { MINUTES_STATUSES, MinutesDto, MinutesStatus, Page } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-minutes',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './minutes.html',
})
export class MinutesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly statuses = MINUTES_STATUSES;
  readonly tone = TONE;
  status: MinutesStatus | '' = '';
  readonly page = signal<Page<MinutesDto> | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(n = 0): void {
    this.api.listMinutes(this.status, n).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.apiError(e),
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { saveBlob } from '../../core/files';
import { TONE } from '../../core/labels';
import { LocalDatePipe } from '../../core/local-date.pipe';
import { RequestDto, SessionDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-session-detail',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './session-detail.html',
})
export class SessionDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly session = signal<SessionDto | null>(null);
  readonly approvedRequests = signal<RequestDto[]>([]);
  requestId: number | null = null;
  readonly tone = TONE;

  ngOnInit(): void {
    this.reload();
    this.api.searchRequests({ status: 'APPROVED', size: 50 }).subscribe({
      next: (p) => this.approvedRequests.set(p.content),
      error: () => undefined,
    });
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    this.api.getSession(this.id()).subscribe({
      next: (s) => this.session.set(s),
      error: (e) => this.toast.apiError(e),
    });
  }

  addItem(): void {
    if (!this.requestId) {
      this.toast.error('sessions.detail.selectRequest');
      return;
    }
    this.api.addAgendaItem(this.id(), this.requestId).subscribe({
      next: (s) => {
        this.session.set(s);
        this.toast.ok('sessions.detail.itemAdded');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  removeItem(itemId: number): void {
    this.api.removeAgendaItem(this.id(), itemId).subscribe({
      next: (s) => this.session.set(s),
      error: (e) => this.toast.apiError(e),
    });
  }

  move(index: number, dir: -1 | 1): void {
    const items = [...(this.session()?.items ?? [])];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    this.api.reorderAgendaItems(this.id(), items.map((i) => i.id)).subscribe({
      next: (s) => this.session.set(s),
      error: (e) => this.toast.apiError(e),
    });
  }

  async closeAgenda(): Promise<void> {
    if (!(await this.confirm.ask('sessions.detail.closeAgendaTitle', 'sessions.detail.closeAgendaMessage', 'sessions.detail.closeAgendaTitle'))) return;
    this.api.closeAgenda(this.id()).subscribe({
      next: (s) => {
        this.session.set(s);
        this.toast.ok('sessions.detail.agendaClosed');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  downloadSummons(): void {
    this.api.downloadSummons(this.id()).subscribe({
      next: (b) => saveBlob(b, `summons-${this.id()}.pdf`),
      error: (e) => this.toast.apiError(e),
    });
  }

  async generateMinutes(): Promise<void> {
    if (!(await this.confirm.ask('sessions.detail.generateMinutes', 'sessions.detail.generateMinutesMessage', 'sessions.detail.generate'))) return;
    this.api.generateMinutes(this.id()).subscribe({
      next: (m) => {
        this.toast.ok('sessions.detail.minutesGenerated');
        void this.router.navigate(['/minutes', m.id]);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

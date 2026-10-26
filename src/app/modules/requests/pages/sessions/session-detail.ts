import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { MinutesApi } from '@modules/minutes';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { saveBlob } from '@shared/utils/files';
import { TONE } from '@shared/utils/labels';
import { RequestsApi } from '../../requests.api';
import { GuestPayload, SessionDto } from '../../requests.models';

@Component({
  selector: 'app-session-detail',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './session-detail.html',
})
export class SessionDetailPage implements OnInit {
  private readonly api = inject(RequestsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly minutesApi = inject(MinutesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly session = signal<SessionDto | null>(null);
  urgentTitle = '';
  urgentDescription = '';
  guest: GuestPayload = { name: '', email: '', affiliation: '' };
  readonly tone = TONE;
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  councilTypeId = 0;
  scheduledAt = '';
  location = '';
  readonly savingSession = signal(false);
  readonly flowOrder = ['agenda', 'cite', 'live', 'minutes'] as const;
  readonly flowStep = computed(() => {
    const s = this.session();
    if (!s || !s.agendaClosed) return s?.items.length ? 'cite' : 'agenda';
    if (s.status === 'FINISHED') return 'minutes';
    return 'live';
  });

  ngOnInit(): void {
    if (this.auth.has('ROLE_ADMIN')) {
      this.usersApi.listCouncilTypes().subscribe({ next: (types) => this.councilTypes.set(types) });
    }
    this.reload();
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    this.api.getSession(this.id()).subscribe({
      next: (s) => {
        this.session.set(s);
        this.councilTypeId = s.councilTypeId;
        this.scheduledAt = s.scheduledAt.slice(0, 16);
        this.location = s.location ?? '';
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  addUrgentItem(): void {
    if (!this.urgentTitle.trim()) {
      this.toast.error('sessions.urgentForm.titleRequired');
      return;
    }
    this.api.addUrgentItem(this.id(), this.urgentTitle.trim(), this.urgentDescription.trim()).subscribe({
      next: (s) => {
        this.session.set(s);
        this.urgentTitle = '';
        this.urgentDescription = '';
        this.toast.ok('sessions.detail.itemAdded');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  addGuest(): void {
    if (!this.guest.name.trim()) {
      this.toast.error('sessions.guests.nameRequired');
      return;
    }
    this.api.addGuest(this.id(), this.guest).subscribe({
      next: (s) => {
        this.session.set(s);
        this.guest = { name: '', email: '', affiliation: '' };
        this.toast.ok('sessions.guests.added');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  removeGuest(guestId: number): void {
    this.api.removeGuest(this.id(), guestId).subscribe({
      next: (s) => this.session.set(s),
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

  flowClass(step: (typeof this.flowOrder)[number]): string {
    const current = this.flowOrder.indexOf(this.flowStep());
    const index = this.flowOrder.indexOf(step);
    if (index < current) return 'done';
    if (index === current) return 'now';
    return '';
  }

  flowHint(): string {
    const s = this.session();
    if (this.flowStep() === 'live' && s && (s.status === 'STARTED' || s.status === 'SUSPENDED')) {
      return 'sessions.flow.now.liveOpen';
    }
    return 'sessions.flow.now.' + this.flowStep();
  }

  saveSession(): void {
    this.savingSession.set(true);
    this.api.correctSession(this.id(), this.councilTypeId, this.scheduledAt, this.location.trim() || null).subscribe({
      next: (s) => {
        this.session.set(s);
        this.savingSession.set(false);
        this.toast.ok('records.sessionSaved');
      },
      error: (e) => {
        this.savingSession.set(false);
        this.toast.apiError(e);
      },
    });
  }

  async removeSession(): Promise<void> {
    if (!(await this.confirm.ask('records.deleteTitle', 'records.deleteSession', 'records.remove'))) return;
    this.api.deleteSession(this.id()).subscribe({
      next: () => {
        this.toast.ok('records.deleted');
        void this.router.navigate(['/sessions']);
      },
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

  downloadNotice(): void {
    this.api.downloadNotice(this.id()).subscribe({
      next: (b) => saveBlob(b, 'Citación.pdf'),
      error: (e) => this.toast.apiError(e),
    });
  }

  async generateMinutes(): Promise<void> {
    if (!(await this.confirm.ask('sessions.detail.generateMinutes', 'sessions.detail.generateMinutesMessage', 'sessions.detail.generate'))) return;
    this.minutesApi.generateMinutes(this.id()).subscribe({
      next: (m) => {
        this.toast.ok('sessions.detail.minutesGenerated');
        void this.router.navigate(['/minutes', m.id]);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

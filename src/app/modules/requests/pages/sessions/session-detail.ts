import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ApiError } from '@core/http/api.models';
import { ConfirmService } from '@core/ui/confirm.service';
import { DocumentViewerService } from '@core/ui/document-viewer.service';
import { ToastService } from '@core/ui/toast.service';
import { MinutesApi } from '@modules/minutes';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { saveBlob } from '@shared/utils/files';
import { TONE } from '@shared/utils/labels';
import { RequestsApi } from '../../requests.api';
import { AttachmentDto, GuestPayload, RequestDto, SessionDto, SummonedDto } from '../../requests.models';

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
  private readonly docs = inject(DocumentViewerService);
  readonly session = signal<SessionDto | null>(null);
  readonly approved = signal<RequestDto[]>([]);
  readonly people = signal<SummonedDto[]>([]);
  readonly personQuery = signal('');
  readonly visiblePeople = computed(() => {
    const self = this.auth.user()?.id;
    const text = this.personQuery().trim().toLowerCase();
    return this.people().filter((person) => person.userId !== self && (!text || person.name.toLowerCase().includes(text)));
  });
  requestQuery = '';
  urgentTitle = '';
  urgentDescription = '';
  guest: GuestPayload = { name: '', email: '', affiliation: '' };
  readonly tone = TONE;
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  councilTypeId = 0;
  scheduledAt = '';
  location = '';
  readonly savingSession = signal(false);
  readonly resendingNotice = signal(false);
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
    if (this.auth.has('ROLE_COUNCIL_SECRETARY') || this.auth.has('ROLE_ADMIN')) {
      this.api.summonable().subscribe({
        next: (people) => this.people.set(people),
        error: (e) => this.toast.apiError(e),
      });
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
        if (!s.agendaClosed && (this.auth.has('ROLE_COUNCIL_SECRETARY') || this.auth.has('ROLE_ADMIN'))) {
          this.loadApproved();
        }
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  visibleApproved(): RequestDto[] {
    const query = this.requestQuery.trim().toLowerCase();
    if (!query) return this.approved();
    return this.approved().filter((item) =>
      `${item.code} ${item.title} ${item.requester}`.toLowerCase().includes(query));
  }

  countsSelf(): boolean {
    const self = this.auth.user()?.id;
    return self != null && (this.session()?.summoned ?? []).some((person) => person.userId === self);
  }

  isCited(userId: number): boolean {
    return (this.session()?.summoned ?? []).some((person) => person.userId === userId);
  }

  setCited(userId: number, cited: boolean): void {
    const current = (this.session()?.summoned ?? []).map((person) => person.userId);
    const memberIds = cited
      ? [...new Set([...current, userId])]
      : current.filter((id) => id !== userId);
    this.api.updateSummons(this.id(), memberIds).subscribe({
      next: (s) => {
        this.session.set(s);
        this.toast.ok('sessions.detail.summonsSaved');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  addRequest(requestId: number): void {
    this.api.addAgendaItem(this.id(), requestId).subscribe({
      next: (s) => {
        this.session.set(s);
        this.approved.update((list) => list.filter((item) => item.id !== requestId));
        this.toast.ok('sessions.detail.itemAdded');
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
    this.confirm.wait('sessions.detail.noticeSendingTitle', 'sessions.detail.noticeSendingMessage');
    this.api.closeAgenda(this.id()).subscribe({
      next: (s) => {
        this.session.set(s);
        this.confirm.tellKey('sessions.detail.agendaClosed', true, 'sessions.detail.noticeSentMessage');
      },
      error: (e) => {
        this.confirm.dismiss();
        this.toast.apiError(e);
      },
    });
  }

  async resendNotice(): Promise<void> {
    if (!(await this.confirm.ask('sessions.detail.resendNoticeTitle', 'sessions.detail.resendNoticeMessage', 'sessions.detail.resendNotice'))) {
      return;
    }
    this.resendingNotice.set(true);
    this.confirm.wait('sessions.detail.noticeSendingTitle', 'sessions.detail.noticeSendingMessage');
    this.api.resendNotice(this.id()).subscribe({
      next: (s) => {
        this.session.set(s);
        this.resendingNotice.set(false);
        this.confirm.tellKey('sessions.detail.noticeResent', true, 'sessions.detail.noticeSentMessage');
      },
      error: (e) => {
        this.resendingNotice.set(false);
        this.confirm.dismiss();
        this.toast.apiError(e);
      },
    });
  }

  previewNotice(): void {
    this.docs.show(this.api.downloadNotice(this.id()), 'Citación.pdf');
  }

  previewAttachment(requestId: number, file: AttachmentDto): void {
    this.docs.show(this.api.downloadAttachment(requestId, file.id), file.name || 'documento.pdf');
  }

  downloadAttachment(requestId: number, file: AttachmentDto): void {
    this.api.downloadAttachment(requestId, file.id).subscribe({
      next: (b) => saveBlob(b, file.name || 'documento.pdf'),
      error: (e) => this.toast.apiError(e),
    });
  }

  private loadApproved(): void {
    this.api.searchRequests({ status: 'APPROVED', size: 50 }).subscribe({
      next: (page) => this.approved.set(page.content),
      error: () => undefined,
    });
  }

  async generateMinutes(): Promise<void> {
    if (!(await this.confirm.ask('sessions.detail.generateMinutes', 'sessions.detail.generateMinutesMessage', 'sessions.detail.generate'))) return;
    this.minutesApi.generateMinutes(this.id()).subscribe({
      next: (m) => {
        this.toast.ok('sessions.detail.minutesGenerated');
        void this.router.navigate(['/minutes', m.id]);
      },
      error: (e) => {
        if (isMinutesAlreadyExist(e)) {
          this.ensureAgreementDrafts();
          return;
        }
        this.toast.apiError(e);
      },
    });
  }

  private ensureAgreementDrafts(): void {
    this.minutesApi.ensureAgreementDrafts(this.id()).subscribe({
      next: (r) => {
        if (r.created > 0) {
          this.toast.ok('sessions.detail.agreementDraftsCreated', { count: r.created });
        } else {
          this.toast.info('sessions.detail.agreementDraftsAlreadyOk');
        }
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

function isMinutesAlreadyExist(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || err.status !== 409) {
    return false;
  }
  const body = err.error as ApiError | null;
  return !!body && typeof body === 'object' && body.message === 'Minutes already exist for this session';
}

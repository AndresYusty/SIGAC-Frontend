import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { AgendaItemDto, DECISION_OUTCOMES, RequestsApi, SessionDto } from '@modules/requests';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TONE } from '@shared/utils/labels';
import { LiveSessionApi } from '../../session.api';
import { AttendanceDto, DecisionPayload } from '../../session.models';

type SessionAction = 'start' | 'suspend' | 'resume' | 'finish';

@Component({
  selector: 'app-session-live',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './session-live.html',
})
export class SessionLivePage implements OnInit, OnDestroy {
  private readonly api = inject(LiveSessionApi);
  private readonly requestsApi = inject(RequestsApi);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly session = signal<SessionDto | null>(null);
  readonly attendance = signal<AttendanceDto | null>(null);
  readonly voteWarning = signal(false);
  readonly tone = TONE;
  readonly outcomes = DECISION_OUTCOMES;
  decisions: Record<number, DecisionPayload> = {};
  private timer?: number;
  private attendanceSave = 0;
  private attendanceApplied = 0;

  ngOnInit(): void {
    this.reload();
    this.timer = window.setInterval(() => this.reload(true), 12000);
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(silent = false): void {
    this.requestsApi.getSession(this.id()).subscribe({
      next: (s) => {
        this.session.set(s);
        for (const item of s.items) {
          this.decisions[item.id] ??= {
            outcome: item.outcome ?? 'APPROVED',
            votesFor: item.votesFor,
            votesAgainst: item.votesAgainst,
            abstentions: item.abstentions,
            changeReason: '',
          };
        }
      },
      error: (e) => {
        if (!silent) this.toast.apiError(e);
      },
    });
    this.api.getAttendance(this.id()).subscribe({
      next: (a) => {
        if (silent && this.attendanceSave !== this.attendanceApplied) return;
        this.attendance.set(a);
        this.fitVotesToSeats();
      },
      error: () => undefined,
    });
  }

  canMarkAttendance(): boolean {
    const status = this.session()?.status;
    return this.auth.has('ROLE_COUNCIL_SECRETARY') && (status === 'CONVENED' || status === 'STARTED' || status === 'SUSPENDED');
  }

  setPresent(attendee: AttendanceDto['attendees'][number], present: boolean): void {
    if (!this.canMarkAttendance()) return;
    attendee.present = present;
    this.saveAttendance(true);
  }

  saveAttendance(quiet = false): void {
    const saveId = ++this.attendanceSave;
    const items = (this.attendance()?.attendees ?? []).map((a) => ({ userId: a.userId, present: a.present }));
    this.api.saveAttendance(this.id(), items).subscribe({
      next: (a) => {
        if (saveId !== this.attendanceSave) return;
        this.attendanceApplied = saveId;
        this.attendance.set(a);
        this.fitVotesToSeats();
        if (!quiet) this.toast.ok('sessions.live.attendanceSaved');
      },
      error: (e) => {
        if (saveId === this.attendanceSave) this.attendanceApplied = saveId;
        this.toast.apiError(e);
      },
    });
  }

  act(action: SessionAction): void {
    const call = {
      start: () => this.api.startSession(this.id()),
      suspend: () => this.api.suspendSession(this.id()),
      resume: () => this.api.resumeSession(this.id()),
      finish: () => this.api.finishSession(this.id()),
    }[action];
    call().subscribe({
      next: (s) => {
        this.session.set(s);
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  seats(): number {
    return this.attendance()?.quorum.present ?? 0;
  }

  setVotes(itemId: number, field: 'votesFor' | 'votesAgainst' | 'abstentions', input: HTMLInputElement): void {
    const draft = this.decisions[itemId];
    if (!draft) return;
    const raw = input.value.trim();
    if (raw === '') {
      draft[field] = 0;
      this.voteWarning.set(false);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      input.value = String(this.votes(draft[field]));
      return;
    }
    const entered = Math.max(0, Math.floor(parsed));
    const allowed = Math.min(entered, this.roomFor(draft, field));
    draft[field] = allowed;
    if (entered !== allowed || String(entered) !== raw) {
      input.value = String(allowed);
    }
    this.voteWarning.set(entered > allowed);
  }

  recordDecision(item: AgendaItemDto): void {
    const draft = this.decisions[item.id];
    const inFavor = this.votes(draft.votesFor);
    const against = this.votes(draft.votesAgainst);
    const abstentions = this.votes(draft.abstentions);
    const seats = this.seats();
    if (inFavor + against + abstentions > seats) {
      this.toast.error('sessions.live.tooManyVotes', { count: seats });
      return;
    }
    if (draft.outcome === 'APPROVED' && inFavor <= against) {
      this.toast.error('sessions.live.approveNeedsMajority');
      return;
    }
    if (draft.outcome === 'DENIED' && against <= inFavor) {
      this.toast.error('sessions.live.denyNeedsMajority');
      return;
    }
    const body: DecisionPayload = {
      ...draft,
      votesFor: inFavor,
      votesAgainst: against,
      abstentions,
      changeReason: draft.changeReason?.trim() || undefined,
    };
    this.api.recordDecision(this.id(), item.id, body).subscribe({
      next: () => {
        draft.changeReason = '';
        this.toast.ok('sessions.live.decisionRecorded');
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  private votes(value: number): number {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  /** Seats still free for this field after the other two counts. */
  private roomFor(draft: DecisionPayload, field: 'votesFor' | 'votesAgainst' | 'abstentions'): number {
    const others = (field === 'votesFor' ? 0 : this.votes(draft.votesFor))
      + (field === 'votesAgainst' ? 0 : this.votes(draft.votesAgainst))
      + (field === 'abstentions' ? 0 : this.votes(draft.abstentions));
    return Math.max(0, this.seats() - others);
  }

  /** If someone is marked absent, drop votes that no longer have a seat. */
  private fitVotesToSeats(): void {
    const seats = this.seats();
    for (const draft of Object.values(this.decisions)) {
      let room = seats;
      for (const field of ['votesFor', 'votesAgainst', 'abstentions'] as const) {
        const count = Math.min(this.votes(draft[field]), room);
        draft[field] = count;
        room -= count;
      }
    }
  }

  async finish(): Promise<void> {
    if (!(await this.confirm.ask('sessions.live.finishTitle', 'sessions.live.finishMessage', 'sessions.live.finish'))) return;
    this.act('finish');
  }
}

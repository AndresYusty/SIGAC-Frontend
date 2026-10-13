import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { AgendaItemDto, DECISION_RESULTS, RequestsApi, SessionDto } from '@modules/requests';
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
  readonly tone = TONE;
  readonly results = DECISION_RESULTS;
  notes: Record<number, string> = {};
  miscTitle = '';
  miscDescription = '';
  decisions: Record<number, DecisionPayload> = {};
  private timer?: number;

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
            result: item.result ?? 'APPROVED',
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
      next: (a) => this.attendance.set(a),
      error: () => undefined,
    });
  }

  saveAttendance(): void {
    const items = (this.attendance()?.attendees ?? []).map((a) => ({ userId: a.userId, present: a.present }));
    this.api.saveAttendance(this.id(), items).subscribe({
      next: (a) => {
        this.attendance.set(a);
        this.toast.ok('sessions.live.attendanceSaved');
      },
      error: (e) => this.toast.apiError(e),
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

  recordDecision(item: AgendaItemDto): void {
    const draft = this.decisions[item.id];
    const body: DecisionPayload = { ...draft, changeReason: draft.changeReason?.trim() || undefined };
    this.api.recordDecision(this.id(), item.id, body).subscribe({
      next: () => {
        draft.changeReason = '';
        this.toast.ok('sessions.live.decisionRecorded');
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  addNote(item: AgendaItemDto): void {
    const text = this.notes[item.id]?.trim();
    if (!text) return;
    this.api.saveDebateNotes(this.id(), item.id, text).subscribe({
      next: () => {
        this.notes[item.id] = '';
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  addMiscItem(): void {
    if (!this.miscTitle.trim()) return;
    this.api.addMiscItem(this.id(), this.miscTitle, this.miscDescription).subscribe({
      next: (s) => {
        this.session.set(s);
        this.miscTitle = '';
        this.miscDescription = '';
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  async finish(): Promise<void> {
    if (!(await this.confirm.ask('sessions.live.finishTitle', 'sessions.live.finishMessage', 'sessions.live.finish'))) return;
    this.act('finish');
  }
}

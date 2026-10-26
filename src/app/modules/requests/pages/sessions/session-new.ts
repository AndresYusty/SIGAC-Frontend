import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/ui/toast.service';
import { CouncilKind, CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { RequestsApi } from '../../requests.api';
import { RequestDto, SessionSummaryDto, SummonedDto } from '../../requests.models';

@Component({
  selector: 'app-session-new',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe, LocalDatePipe],
  templateUrl: './session-new.html',
})
export class SessionNewPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RequestsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly kind = signal<CouncilKind | null>(null);
  readonly saving = signal(false);
  readonly people = signal<SummonedDto[]>([]);
  readonly personQuery = signal('');
  readonly selectedIds = signal<number[]>([]);
  readonly request = signal<RequestDto | null>(null);
  readonly openSessions = signal<SessionSummaryDto[]>([]);
  /** Native picker minimum: days before today stay disabled. */
  readonly earliest = localInput(new Date());
  readonly visiblePeople = computed(() => {
    const self = this.auth.user()?.id;
    const text = this.personQuery().trim().toLowerCase();
    return this.people().filter((person) => person.userId !== self && (!text || person.name.toLowerCase().includes(text)));
  });
  readonly citedCount = computed(() => this.selectedIds().length + (this.countsSelf() ? 1 : 0));
  readonly form = this.fb.nonNullable.group({
    councilTypeId: [0, Validators.required],
    scheduledAt: ['', [Validators.required, upcoming]],
    location: ['', Validators.required],
  });

  ngOnInit(): void {
    this.form.controls.councilTypeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.applyKind(Number(id)));
    this.usersApi.listCouncilTypes().subscribe({
      next: (types) => {
        this.councilTypes.set(types);
        if (types[0]) {
          this.form.patchValue({ councilTypeId: types[0].id });
        }
      },
    });
    this.api.summonable().subscribe({
      next: (people) => this.people.set(people),
      error: (e) => this.toast.apiError(e),
    });
    const raw = this.route.snapshot.queryParamMap.get('request');
    if (!raw) return;
    this.api.getRequest(Number(raw)).subscribe({
      next: (request) => {
        if (request.status !== 'APPROVED') return;
        this.request.set(request);
      },
      error: (e) => this.toast.apiError(e),
    });
    this.api.listSessions('SCHEDULED', 0, 20).subscribe({
      next: (page) => this.openSessions.set(page.content.filter((session) => !session.agendaClosed)),
      error: () => undefined,
    });
  }

  includeIn(sessionId: number): void {
    const request = this.request();
    if (!request) return;
    this.saving.set(true);
    this.api.addAgendaItem(sessionId, request.id).subscribe({
      next: () => {
        this.toast.ok('sessions.place.added');
        void this.router.navigate(['/sessions', sessionId]);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }

  countsSelf(): boolean {
    const self = this.auth.user()?.id;
    return self != null && this.people().some((person) => person.userId === self);
  }

  isSelected(userId: number): boolean {
    return this.selectedIds().includes(userId);
  }

  setSelected(userId: number, selected: boolean): void {
    const current = this.selectedIds();
    if (selected && !current.includes(userId)) {
      this.selectedIds.set([...current, userId]);
    } else if (!selected && current.includes(userId)) {
      this.selectedIds.set(current.filter((id) => id !== userId));
    }
  }

  /** Virtual councils are held by email, so the location is optional. */
  private applyKind(councilTypeId: number): void {
    const kind = this.councilTypes().find((t) => t.id === councilTypeId)?.kind ?? null;
    this.kind.set(kind);
    const location = this.form.controls.location;
    location.setValidators(kind === 'VIRTUAL' ? [] : [Validators.required]);
    location.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const memberIds = [...this.selectedIds()];
    const self = this.auth.user()?.id;
    if (self != null && this.countsSelf() && !memberIds.includes(self)) {
      memberIds.push(self);
    }
    if (!memberIds.length) {
      this.toast.error('sessions.new.pickSomeone');
      return;
    }
    const voting = this.people().some((person) => memberIds.includes(person.userId) && person.role !== 'ROLE_COUNCIL_SECRETARY');
    if (!voting) {
      this.toast.error('sessions.new.pickVoter');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    const requestId = this.request()?.id;
    this.api.createSession(Number(v.councilTypeId), v.scheduledAt, v.location.trim() || null, memberIds).subscribe({
      next: (s) => {
        if (!requestId) {
          this.toast.ok('sessions.new.scheduled');
          void this.router.navigate(['/sessions', s.id]);
          return;
        }
        this.api.addAgendaItem(s.id, requestId).subscribe({
          next: () => {
            this.toast.ok('sessions.place.added');
            void this.router.navigate(['/sessions', s.id]);
          },
          error: (e) => {
            this.saving.set(false);
            this.toast.apiError(e);
            void this.router.navigate(['/sessions', s.id]);
          },
        });
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }
}

function localInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function upcoming(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const chosen = new Date(control.value);
  if (Number.isNaN(chosen.getTime()) || chosen.getTime() > Date.now()) return null;
  return { past: true };
}

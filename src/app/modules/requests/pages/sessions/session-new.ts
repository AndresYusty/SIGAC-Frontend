import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '@core/ui/toast.service';
import { CouncilKind, CouncilTypeDto, UsersApi } from '@modules/users';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { RequestsApi } from '../../requests.api';
import { SummonedDto } from '../../requests.models';

@Component({
  selector: 'app-session-new',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './session-new.html',
})
export class SessionNewPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RequestsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly kind = signal<CouncilKind | null>(null);
  readonly saving = signal(false);
  readonly people = signal<SummonedDto[]>([]);
  readonly personQuery = signal('');
  readonly selectedIds = signal<number[]>([]);
  readonly visiblePeople = computed(() => {
    const text = this.personQuery().trim().toLowerCase();
    return this.people().filter((person) => !text || person.name.toLowerCase().includes(text));
  });
  readonly form = this.fb.nonNullable.group({
    councilTypeId: [0, Validators.required],
    scheduledAt: ['', Validators.required],
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
    const memberIds = this.selectedIds();
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
    this.api.createSession(Number(v.councilTypeId), v.scheduledAt, v.location.trim() || null, memberIds).subscribe({
      next: (s) => {
        this.toast.ok('sessions.new.scheduled');
        void this.router.navigate(['/sessions', s.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }
}

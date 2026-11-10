import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleName, ROLES, UserDto } from '@core/auth/auth.models';
import { I18nService } from '@core/i18n/i18n.service';
import { Page } from '@core/http/api.models';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { forkJoin } from 'rxjs';
import { UsersApi } from '../../users.api';
import { NodeDto } from '../../users.models';

const DEFAULT_ROLE: RoleName = 'ROLE_COUNCIL_MEMBER';

interface FacultyOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './users.html',
})
export class UsersPage implements OnInit {
  private readonly api = inject(UsersApi);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);
  readonly page = signal<Page<UserDto> | null>(null);
  readonly formError = signal('');
  readonly faculties = signal<FacultyOption[]>([]);
  readonly programs = signal<NodeDto[]>([]);
  readonly editing = signal<UserDto | null>(null);
  readonly showPassword = signal(false);
  readonly roles = ROLES;
  q = '';
  showForm = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: [DEFAULT_ROLE, Validators.required],
    facultyId: ['' as string | number],
    programId: ['' as string | number],
  });

  ngOnInit(): void {
    this.load();
    this.api.listUniversities().subscribe({
      next: (universities) => {
        const university = universities[0];
        if (!university) return;
        this.api.listCampuses(university.id).subscribe((campuses) => {
          if (!campuses.length) {
            this.faculties.set([]);
            return;
          }
          // Every campus: the old code only took campuses[0], so users of other seats
          // (e.g. Sede principal) appeared with a blank faculty in this form.
          forkJoin(campuses.map((campus) => this.api.listFaculties(campus.id))).subscribe({
            next: (groups) => {
              const several = campuses.length > 1;
              const options = campuses.flatMap((campus, i) =>
                groups[i].map((f) => ({
                  id: f.id,
                  label: several ? `${f.name} (${campus.name})` : f.name,
                })),
              );
              options.sort((a, b) => a.label.localeCompare(b.label, 'es'));
              this.faculties.set(options);
              // Options arrive after the form may already be open: re-write the value so the
              // <select> picks the matching option (string id, same as [value]).
              const selected = this.form.controls.facultyId.value;
              if (selected !== '' && selected != null) {
                this.form.controls.facultyId.setValue(String(selected));
              }
            },
            error: (e) => this.toast.apiError(e),
          });
        });
      },
    });
  }

  loadFacultyPrograms(ev?: Event): void {
    const raw = ev ? (ev.target as HTMLSelectElement).value : this.form.controls.facultyId.value;
    const id = Number(raw);
    if (ev) {
      this.form.controls.programId.setValue('');
    }
    if (!id) {
      this.programs.set([]);
      return;
    }
    this.api.listPrograms(id).subscribe({ next: (p) => this.programs.set(p) });
  }

  load(n = 0): void {
    this.api.listUsers(this.q, n).subscribe({
      next: (p) => this.page.set(p),
      error: (e) => this.toast.apiError(e),
    });
  }

  search(ev: Event): void {
    this.q = (ev.target as HTMLInputElement).value;
    this.load();
  }

  create(): void {
    this.editing.set(null);
    this.formError.set('');
    this.showPassword.set(false);
    this.form.reset({ name: '', email: '', password: '', role: DEFAULT_ROLE, facultyId: '', programId: '' });
    this.programs.set([]);
    this.applyScopeForRole(DEFAULT_ROLE);
    this.showForm = true;
  }

  edit(u: UserDto): void {
    this.editing.set(u);
    this.formError.set('');
    this.showPassword.set(false);
    const role = u.roles[0] ?? DEFAULT_ROLE;
    // Keep ids as strings so they match <option [value]="..."> (always string in the DOM).
    this.form.patchValue({
      name: u.name,
      email: u.email,
      password: '',
      role,
      facultyId: u.facultyId != null ? String(u.facultyId) : '',
      programId: u.programId != null ? String(u.programId) : '',
    });
    this.applyScopeForRole(role);
    if (!this.isGlobalRole(role)) {
      this.loadFacultyPrograms();
    }
    this.showForm = true;
  }

  onRoleChange(): void {
    this.applyScopeForRole(this.form.controls.role.value);
  }

  /** Admin is global (RN-01): faculty and program stay empty and locked. */
  isGlobalRole(role: RoleName = this.form.controls.role.value): boolean {
    return role === 'ROLE_ADMIN';
  }

  private applyScopeForRole(role: RoleName): void {
    if (this.isGlobalRole(role)) {
      this.form.controls.facultyId.setValue('');
      this.form.controls.programId.setValue('');
      this.programs.set([]);
      this.form.controls.facultyId.disable({ emitEvent: false });
      this.form.controls.programId.disable({ emitEvent: false });
      return;
    }
    this.form.controls.facultyId.enable({ emitEvent: false });
    this.form.controls.programId.enable({ emitEvent: false });
  }

  save(): void {
    this.formError.set('');
    const raw = this.form.getRawValue();
    this.form.patchValue({ name: raw.name.trim(), email: raw.email.trim() });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set(this.i18n.t('users.invalid'));
      return;
    }
    const v = this.form.getRawValue();
    const global = this.isGlobalRole(v.role);
    const facultyId = global || !v.facultyId ? null : Number(v.facultyId);
    const programId = global || !v.programId ? null : Number(v.programId);
    if (v.role === 'ROLE_PROGRAM_HEAD' && !programId) {
      this.form.controls.programId.markAsTouched();
      this.formError.set(this.i18n.t('users.programRequired'));
      return;
    }
    if (!this.editing() && !this.acceptablePassword(v.password)) {
      this.form.controls.password.markAsTouched();
      this.formError.set(this.i18n.t('errors.passwordPolicy'));
      return;
    }
    const current = this.editing();
    if (current) {
      this.api.updateUser(current.id, { name: v.name, roles: [v.role], facultyId, programId }).subscribe({
        next: () => {
          this.toast.ok('users.updated');
          this.showForm = false;
          this.load(this.page()?.number ?? 0);
        },
        error: (e) => this.fail(e),
      });
    } else {
      this.api
        .createUser({ name: v.name, email: v.email, password: v.password, roles: [v.role], facultyId, programId })
        .subscribe({
          next: () => {
            this.toast.ok('users.created');
            this.showForm = false;
            this.load();
          },
          error: (e) => this.fail(e),
        });
    }
  }

  private acceptablePassword(password: string): boolean {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  }

  private fail(error: unknown): void {
    this.formError.set(this.toast.apiErrorText(error));
    this.toast.apiError(error);
  }

  async toggle(u: UserDto): Promise<void> {
    const ok = await this.confirm.ask(
      u.active ? 'users.deactivateTitle' : 'users.activateTitle',
      'users.toggleMessage',
      u.active ? 'users.deactivate' : 'users.activate',
      { name: u.name },
    );
    if (!ok) return;
    this.api.setUserActive(u.id, !u.active).subscribe({
      next: () => {
        this.toast.ok('users.statusUpdated');
        this.load(this.page()?.number ?? 0);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  async remove(u: UserDto): Promise<void> {
    if (u.active) return;
    const ok = await this.confirm.ask('users.deleteTitle', 'users.deleteMessage', 'users.delete', { name: u.name });
    if (!ok) return;
    this.api.deleteUser(u.id).subscribe({
      next: () => {
        this.toast.ok('users.deleted', { name: u.name });
        this.load(this.page()?.number ?? 0);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

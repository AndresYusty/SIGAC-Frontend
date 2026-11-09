import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/ui/toast.service';
import { NodeDto, UsersApi } from '@modules/users';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { RequestsApi } from '../../requests.api';
import {
  AttachmentDto,
  CancellationKind,
  RequestBranch,
  RequestCatalog,
  TopicDto,
} from '../../requests.models';

interface CourseDraft {
  courseName: string;
  groupCode: string;
  subgroup: string;
  courseNumber: string;
  gradeNumber: string;
  gradeWords: string;
  attendedRegularly: '' | 'true' | 'false';
  failingCourse: '' | 'true' | 'false';
}

@Component({
  selector: 'app-request-form',
  imports: [FormsModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './request-form.html',
})
export class RequestFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RequestsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly id = signal<number | null>(null);
  readonly catalog = signal<RequestCatalog | null>(null);
  readonly programs = signal<NodeDto[]>([]);
  readonly existing = signal<AttachmentDto[]>([]);
  readonly files = signal<Record<string, File>>({});
  readonly courses = signal<CourseDraft[]>([emptyCourse()]);
  readonly saving = signal(false);
  readonly liveSessionId = signal<number | null>(null);
  readonly branch = signal<RequestBranch | ''>('');
  readonly topicCode = signal('');

  readonly form = this.fb.nonNullable.group({
    requester: ['', [Validators.required, Validators.maxLength(150)]],
    requestType: ['', Validators.required],
    programId: ['' as string | number],
    filedOn: [todayIso(), Validators.required],
    academicPeriod: ['A', Validators.required],
    studentCode: ['', Validators.maxLength(30)],
    identityDocument: ['', Validators.maxLength(30)],
    identityIssuedIn: ['', Validators.maxLength(80)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    electronicNotice: [true],
    counselorName: ['', Validators.maxLength(150)],
    otherDetail: ['', Validators.maxLength(200)],
    cancellationKind: ['' as CancellationKind | ''],
    justification: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  readonly topics = computed(() => {
    const branch = this.branch();
    return this.catalog()?.branches.find((item) => item.code === branch)?.topics ?? [];
  });

  readonly topic = computed(() => this.topics().find((item) => item.code === this.topicCode()) ?? null);

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const sessionRaw = this.route.snapshot.queryParamMap.get('session');
    const sessionId = Number(sessionRaw);
    if (sessionRaw && Number.isFinite(sessionId) && sessionId > 0) {
      this.liveSessionId.set(sessionId);
    }
    const councilOnly = this.auth.has('ROLE_COUNCIL_SECRETARY')
      && !this.auth.has('ROLE_FACULTY_SECRETARY')
      && !this.auth.has('ROLE_ADMIN');
    if (councilOnly && !this.liveSessionId() && !raw) {
      void this.router.navigate(['/sessions']);
      return;
    }
    this.api.catalog().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        if (catalog.programId) {
          this.form.controls.programId.setValue(catalog.programId);
        }
      },
      error: (e) => this.toast.apiError(e),
    });
    if (!this.auth.user()?.programId && !raw) {
      const facultyId = this.auth.user()?.facultyId;
      if (facultyId) {
        this.usersApi.listPrograms(facultyId).subscribe({ next: (programs) => this.programs.set(programs) });
      } else if (this.auth.has('ROLE_ADMIN')) {
        this.loadPrograms();
      }
    }
    if (raw) {
      const id = Number(raw);
      this.id.set(id);
      this.api.getRequest(id).subscribe({
        next: (r) => {
          this.branch.set(r.branch);
          this.topicCode.set(r.requestType);
          this.setStudentRules(r.branch === 'STUDENT');
          this.form.patchValue({
            requester: r.requester,
            requestType: r.requestType,
            programId: r.programId ?? '',
            filedOn: r.filedOn ?? '',
            academicPeriod: r.academicPeriod ?? 'A',
            studentCode: r.studentCode ?? '',
            identityDocument: r.identityDocument ?? '',
            identityIssuedIn: r.identityIssuedIn ?? '',
            email: r.email ?? '',
            phone: r.phone ?? '',
            electronicNotice: r.electronicNotice,
            counselorName: r.counselorName ?? '',
            otherDetail: r.otherDetail ?? '',
            cancellationKind: r.cancellationKind ?? '',
            justification: r.description,
          });
          if (r.courses.length) {
            this.courses.set(r.courses.map((course) => ({
              courseName: course.courseName,
              groupCode: course.groupCode ?? '',
              subgroup: course.subgroup ?? '',
              courseNumber: course.courseNumber ?? '',
              gradeNumber: course.gradeNumber ?? '',
              gradeWords: course.gradeWords ?? '',
              attendedRegularly: yesNo(course.attendedRegularly),
              failingCourse: yesNo(course.failingCourse),
            })));
          }
          this.existing.set(r.attachments);
          if (this.auth.has('ROLE_ADMIN')) {
            this.usersApi.listPrograms(r.facultyId).subscribe((programs) => this.programs.set(programs));
          }
        },
        error: (e) => this.toast.apiError(e),
      });
    }
  }

  selectBranch(code: string): void {
    this.branch.set(code as RequestBranch);
    this.setStudentRules(code === 'STUDENT');
    this.topicCode.set('');
    this.form.controls.requestType.setValue('');
    this.form.controls.cancellationKind.setValue('');
    this.files.set({});
  }

  selectTopic(code: string): void {
    this.topicCode.set(code);
    this.form.controls.requestType.setValue(code);
    this.form.controls.cancellationKind.setValue('');
    this.files.set({});
  }

  showCourses(): boolean {
    const topic = this.topic();
    if (!topic) return false;
    if (topic.courses) return true;
    return topic.cancellationChoice && this.form.controls.cancellationKind.value === 'COURSE';
  }

  onFile(code: string, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    this.files.update((current) => {
      const next = { ...current };
      if (file) next[code] = file;
      else delete next[code];
      return next;
    });
  }

  already(code: string): AttachmentDto | undefined {
    return this.existing().find((file) => file.documentCode === code);
  }

  addCourse(): void {
    if (this.courses().length >= 6) return;
    this.courses.update((rows) => [...rows, emptyCourse()]);
  }

  removeCourse(index: number): void {
    this.courses.update((rows) => rows.filter((_, i) => i !== index));
  }

  patchCourse(index: number, field: keyof CourseDraft, value: string): void {
    this.courses.update((rows) => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  submit(): void {
    const topic = this.topic();
    if (this.form.invalid || !topic) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.branch() === 'STUDENT' && !this.form.controls.counselorName.value.trim()) {
      this.form.controls.counselorName.markAsTouched();
      this.toast.error('requests.form.counselorRequired');
      return;
    }
    if (this.branch() === 'STUDENT' && (
      !this.form.controls.studentCode.value.trim()
      || !this.form.controls.identityDocument.value.trim()
      || !this.form.controls.identityIssuedIn.value.trim()
    )) {
      this.form.markAllAsTouched();
      this.toast.error('requests.form.identityRequired');
      return;
    }
    if (topic.otherDetail && !this.form.controls.otherDetail.value.trim()) {
      this.toast.error('requests.form.otherRequired');
      return;
    }
    if (topic.cancellationChoice && !this.form.controls.cancellationKind.value) {
      this.toast.error('requests.form.cancellationRequired');
      return;
    }
    const missing = topic.documents.filter((code) => !this.files()[code] && !this.already(code));
    if (missing.length) {
      this.toast.error('requests.form.documentsRequired');
      return;
    }
    if (this.showCourses() && !this.courses().some((row) => row.courseName.trim())) {
      this.toast.error('requests.form.courseRequired');
      return;
    }
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('requester', v.requester);
    fd.append('requestType', v.requestType);
    if (v.programId) fd.append('programId', String(v.programId));
    fd.append('filedOn', v.filedOn);
    fd.append('academicPeriod', v.academicPeriod);
    fd.append('studentCode', v.studentCode);
    fd.append('identityDocument', v.identityDocument);
    fd.append('identityIssuedIn', v.identityIssuedIn);
    fd.append('email', v.email);
    fd.append('phone', v.phone);
    fd.append('electronicNotice', String(v.electronicNotice));
    fd.append('counselorName', v.counselorName);
    fd.append('otherDetail', v.otherDetail);
    if (v.cancellationKind) fd.append('cancellationKind', v.cancellationKind);
    fd.append('justification', v.justification);
    fd.append('coursesJson', JSON.stringify(this.courses().filter((row) => row.courseName.trim()).map((row) => ({
      courseName: row.courseName,
      groupCode: row.groupCode,
      subgroup: row.subgroup,
      courseNumber: row.courseNumber,
      gradeNumber: row.gradeNumber,
      gradeWords: row.gradeWords,
      attendedRegularly: row.attendedRegularly === '' ? null : row.attendedRegularly === 'true',
      failingCourse: row.failingCourse === '' ? null : row.failingCourse === 'true',
    }))));
    for (const code of topic.documents) {
      const file = this.files()[code];
      if (file) {
        fd.append('documents', file, file.name);
        fd.append('documentCodes', code);
      }
    }
    this.saving.set(true);
    const id = this.id();
    const sessionId = this.liveSessionId();
    if (!id && sessionId) {
      this.api.fileLiveRequest(sessionId, fd).subscribe({
        next: () => {
          this.toast.ok('sessions.live.requestAdded');
          void this.router.navigate(['/sessions', sessionId, 'live']);
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.apiError(e);
        },
      });
      return;
    }
    const req = id ? this.api.updateRequest(id, fd) : this.api.fileRequest(fd);
    req.subscribe({
      next: (saved) => {
        this.toast.ok(id ? 'requests.form.updated' : 'requests.form.filed');
        void this.router.navigate(['/requests', saved.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }

  private setStudentRules(student: boolean): void {
    const required = (max: number) => student
      ? [Validators.required, Validators.maxLength(max)]
      : [Validators.maxLength(max)];
    this.form.controls.studentCode.setValidators(required(30));
    this.form.controls.identityDocument.setValidators(required(30));
    this.form.controls.identityIssuedIn.setValidators(required(80));
    this.form.controls.counselorName.setValidators(student
      ? [Validators.required, Validators.maxLength(150)]
      : [Validators.maxLength(150)]);
    this.form.controls.studentCode.updateValueAndValidity();
    this.form.controls.identityDocument.updateValueAndValidity();
    this.form.controls.identityIssuedIn.updateValueAndValidity();
    this.form.controls.counselorName.updateValueAndValidity();
  }

  private loadPrograms(): void {
    this.usersApi.listUniversities().subscribe({
      next: (universities) => {
        const university = universities[0];
        if (!university) return;
        this.usersApi.listCampuses(university.id).subscribe((campuses) => {
          const campus = campuses[0];
          if (!campus) return;
          this.usersApi.listFaculties(campus.id).subscribe((faculties) => {
            const faculty = faculties[0];
            if (!faculty) return;
            this.usersApi.listPrograms(faculty.id).subscribe((programs) => this.programs.set(programs));
          });
        });
      },
    });
  }
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyCourse(): CourseDraft {
  return {
    courseName: '', groupCode: '', subgroup: '', courseNumber: '',
    gradeNumber: '', gradeWords: '', attendedRegularly: '', failingCourse: '',
  };
}

function yesNo(value: boolean | null): '' | 'true' | 'false' {
  if (value === null || value === undefined) return '';
  return value ? 'true' : 'false';
}

export type { TopicDto };

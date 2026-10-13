import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '@core/ui/toast.service';
import { NodeDto, UsersApi } from '@modules/users';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { RequestsApi } from '../../requests.api';
import { REQUEST_TYPES, RequestType } from '../../requests.models';

@Component({
  selector: 'app-request-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './request-form.html',
})
export class RequestFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RequestsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = signal<number | null>(null);
  readonly programs = signal<NodeDto[]>([]);
  readonly files = signal<File[]>([]);
  readonly saving = signal(false);
  readonly types = REQUEST_TYPES;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    applicant: ['', [Validators.required, Validators.maxLength(150)]],
    requestType: ['ACADEMIC' as RequestType, Validators.required],
    programId: ['' as string | number],
  });

  ngOnInit(): void {
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
            this.usersApi.listPrograms(faculty.id).subscribe((p) => this.programs.set(p));
          });
        });
      },
    });
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      const id = Number(raw);
      this.id.set(id);
      this.api.getRequest(id).subscribe({
        next: (r) => {
          this.form.patchValue({
            title: r.title,
            description: r.description,
            applicant: r.applicant,
            requestType: r.requestType,
            programId: r.programId ?? '',
          });
        },
        error: (e) => this.toast.apiError(e),
      });
    }
  }

  onFiles(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.files.set(Array.from(input.files ?? []));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('title', v.title);
    fd.append('description', v.description);
    fd.append('applicant', v.applicant);
    fd.append('requestType', v.requestType);
    if (v.programId) {
      fd.append('programId', String(v.programId));
    }
    for (const f of this.files()) {
      fd.append('attachments', f, f.name);
    }
    this.saving.set(true);
    const id = this.id();
    const req = id ? this.api.updateRequest(id, fd) : this.api.fileRequest(fd);
    req.subscribe({
      next: (r) => {
        this.toast.ok(id ? 'requests.form.updated' : 'requests.form.filed');
        void this.router.navigate(['/requests', r.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }
}

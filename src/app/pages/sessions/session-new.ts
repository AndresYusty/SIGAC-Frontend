import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CouncilTypeDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-session-new',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './session-new.html',
})
export class SessionNewPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    councilTypeId: [0, Validators.required],
    scheduledAt: ['', Validators.required],
    location: ['', Validators.required],
  });

  ngOnInit(): void {
    this.api.listCouncilTypes().subscribe({
      next: (types) => {
        this.councilTypes.set(types);
        if (types[0]) {
          this.form.patchValue({ councilTypeId: types[0].id });
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.createSession(Number(v.councilTypeId), v.scheduledAt, v.location).subscribe({
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

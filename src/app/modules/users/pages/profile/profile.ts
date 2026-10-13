import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.auth.me().subscribe({ error: () => undefined });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.auth.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.toast.ok('profile.passwordUpdated');
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }
}

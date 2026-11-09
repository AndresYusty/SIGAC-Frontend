import { Component, inject, OnInit, signal } from '@angular/core';
import { UserDto } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UsersApi } from '../../users.api';

@Component({
  selector: 'app-staff',
  imports: [TranslatePipe],
  templateUrl: './staff.html',
})
export class StaffPage implements OnInit {
  private readonly api = inject(UsersApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly auth = inject(AuthService);
  readonly staff = signal<UserDto[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listSupportStaff().subscribe({
      next: (rows) => this.staff.set(rows),
      error: (e) => this.toast.apiError(e),
    });
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
        this.load();
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

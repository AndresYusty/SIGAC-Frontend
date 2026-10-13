import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@core/ui/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UsersApi } from '../../users.api';
import { CouncilTypeDto, ParameterDto } from '../../users.models';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './settings.html',
})
export class SettingsPage implements OnInit {
  private readonly api = inject(UsersApi);
  private readonly toast = inject(ToastService);
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly parameters = signal<ParameterDto[]>([]);
  code = '';
  name = '';

  ngOnInit(): void {
    this.api.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.api.listParameters().subscribe({ next: (p) => this.parameters.set(p) });
  }

  createCouncilType(): void {
    this.api.createCouncilType(this.code, this.name).subscribe({
      next: (t) => {
        this.councilTypes.update((list) => [...list, t]);
        this.code = '';
        this.name = '';
        this.toast.ok('settings.toast.councilTypeCreated');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  saveCouncilType(t: CouncilTypeDto): void {
    this.api.updateCouncilType(t.id, t.code, t.name).subscribe({
      next: () => this.toast.ok('settings.toast.councilTypeUpdated'),
      error: (e) => this.toast.apiError(e),
    });
  }

  saveParameter(p: ParameterDto): void {
    this.api.updateParameter(p.key, p.value).subscribe({
      next: () => this.toast.ok('settings.toast.parameterUpdated'),
      error: (e) => this.toast.apiError(e),
    });
  }
}

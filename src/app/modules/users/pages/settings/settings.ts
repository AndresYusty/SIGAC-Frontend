import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@core/ui/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UsersApi } from '../../users.api';
import { blobUrl, saveBlob } from '@shared/utils/files';
import { CouncilTypeDto, LetterheadPart, LetterheadStatus, ParameterDto } from '../../users.models';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './settings.html',
})
export class SettingsPage implements OnInit, OnDestroy {
  private readonly api = inject(UsersApi);
  private readonly toast = inject(ToastService);
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly parameters = signal<ParameterDto[]>([]);
  readonly letterhead = signal<LetterheadStatus | null>(null);
  readonly sheetUrl = signal<string | null>(null);
  private sheetBlob: Blob | null = null;

  ngOnInit(): void {
    this.api.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.api.listParameters().subscribe({ next: (p) => this.parameters.set(p) });
    this.api.letterheadStatus().subscribe({ next: (s) => this.letterhead.set(s) });
    this.loadSheet();
  }

  ngOnDestroy(): void {
    const url = this.sheetUrl();
    if (url) URL.revokeObjectURL(url);
  }

  uploadLetterhead(part: LetterheadPart, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.uploadLetterhead(part, file).subscribe({
      next: (s) => this.letterheadChanged(s, 'settings.toast.letterheadUpdated'),
      error: (e) => this.toast.apiError(e),
    });
    input.value = '';
  }

  resetLetterhead(part: LetterheadPart): void {
    this.api.resetLetterhead(part).subscribe({
      next: (s) => this.letterheadChanged(s, 'settings.toast.letterheadReset'),
      error: (e) => this.toast.apiError(e),
    });
  }

  private letterheadChanged(status: LetterheadStatus, message: string): void {
    this.letterhead.set(status);
    this.toast.ok(message);
    this.loadSheet();
  }

  downloadSheet(): void {
    const file = this.sheetBlob;
    if (!file) return;
    saveBlob(file, `Membrete.${file.type.includes('jpeg') ? 'jpg' : 'png'}`);
  }

  downloadLogo(): void {
    this.api.letterheadLogo().subscribe({
      next: (file) => saveBlob(file, `Logo.${file.type.includes('jpeg') ? 'jpg' : 'png'}`),
      error: (e) => this.toast.apiError(e),
    });
  }

  private loadSheet(): void {
    this.api.letterheadSheet().subscribe({
      next: (b) => {
        const old = this.sheetUrl();
        if (old) URL.revokeObjectURL(old);
        this.sheetBlob = b;
        this.sheetUrl.set(blobUrl(b));
      },
    });
  }

  renameCouncilType(t: CouncilTypeDto): void {
    this.api.renameCouncilType(t.id, t.name).subscribe({
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

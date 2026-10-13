import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl } from '@shared/utils/files';
import { TONE } from '@shared/utils/labels';
import { MinutesApi } from '../../minutes.api';
import { MinutesDto } from '../../minutes.models';

@Component({
  selector: 'app-minutes-detail',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './minutes-detail.html',
})
export class MinutesDetailPage implements OnInit, OnDestroy {
  private readonly api = inject(MinutesApi);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly minutes = signal<MinutesDto | null>(null);
  content = '';
  note = '';
  pdf?: SafeResourceUrl;
  private rawPdf?: string;
  readonly tone = TONE;

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  html(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.content || '');
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    this.api.getMinutes(this.id()).subscribe({
      next: (m) => {
        this.minutes.set(m);
        this.content = m.contentHtml ?? '';
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  save(): void {
    this.api.updateMinutesContent(this.id(), this.content).subscribe({
      next: (m) => {
        this.minutes.set(m);
        this.toast.ok('minutes.toast.contentSaved');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  preview(): void {
    this.api.previewMinutes(this.id()).subscribe({
      next: (b) => {
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  async sendForSignature(): Promise<void> {
    const ok = await this.confirm.ask(
      'minutes.confirm.sendTitle',
      'minutes.confirm.sendMessage',
      'minutes.confirm.sendOk',
    );
    if (!ok) return;
    this.api.sendMinutesForSignature(this.id()).subscribe({
      next: (m) => {
        this.minutes.set(m);
        this.toast.ok('minutes.toast.sentForSignature');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  async sign(): Promise<void> {
    const ok = await this.confirm.ask(
      'minutes.confirm.signTitle',
      'minutes.confirm.signMessage',
      'minutes.confirm.signOk',
    );
    if (!ok) return;
    this.api.signMinutes(this.id()).subscribe({
      next: (m) => {
        this.minutes.set(m);
        this.toast.ok('minutes.toast.signed');
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  reject(): void {
    if (!this.note.trim()) {
      this.toast.error('minutes.toast.noteRequired');
      return;
    }
    this.api.rejectMinutes(this.id(), this.note).subscribe({
      next: (m) => {
        this.minutes.set(m);
        this.toast.ok('minutes.toast.returned');
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

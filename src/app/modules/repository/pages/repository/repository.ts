import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Page } from '@core/http/api.models';
import { ToastService } from '@core/ui/toast.service';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl, saveBlob } from '@shared/utils/files';
import { RepositoryApi } from '../../repository.api';
import { RepositoryMinutesDto, VerificationDto } from '../../repository.models';

@Component({
  selector: 'app-repository',
  imports: [FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './repository.html',
})
export class RepositoryPage implements OnInit, OnDestroy {
  private readonly api = inject(RepositoryApi);
  private readonly usersApi = inject(UsersApi);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  serialNumber = '';
  text = '';
  councilTypeId: number | '' = '';
  from = '';
  to = '';
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly page = signal<Page<RepositoryMinutesDto> | null>(null);
  readonly verification = signal<VerificationDto | null>(null);
  pdf?: SafeResourceUrl;
  private rawPdf?: string;

  ngOnInit(): void {
    this.usersApi.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.load();
  }

  ngOnDestroy(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  load(n = 0): void {
    this.api
      .searchRepository({
        serialNumber: this.serialNumber,
        text: this.text,
        councilTypeId: this.councilTypeId,
        from: this.from,
        to: this.to,
        page: n,
      })
      .subscribe({
        next: (p) => this.page.set(p),
        error: (e) => this.toast.apiError(e),
      });
  }

  verify(id: number): void {
    this.api.verifyMinutes(id).subscribe({
      next: (v) => this.verification.set(v),
      error: (e) => this.toast.apiError(e),
    });
  }

  view(id: number): void {
    this.api.viewMinutes(id).subscribe({
      next: (b) => {
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  download(id: number, serialNumber: string): void {
    this.api.downloadMinutes(id).subscribe({
      next: (b) => saveBlob(b, `minutes-${serialNumber}.pdf`),
      error: (e) => this.toast.apiError(e),
    });
  }
}

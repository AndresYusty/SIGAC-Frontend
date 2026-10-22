import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Page } from '@core/http/api.models';
import { ToastService } from '@core/ui/toast.service';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl, saveBlob } from '@shared/utils/files';
import { LiveQuery } from '@shared/utils/live-query';
import { RepositoryApi } from '../../repository.api';
import { RepositoryMinutesDto } from '../../repository.models';

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
  pdf?: SafeResourceUrl;
  private rawPdf?: string;
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.usersApi.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.load();
  }

  ngOnDestroy(): void {
    this.query.cancel();
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  apply(): void {
    this.query.immediate(() => this.load());
  }

  applyText(): void {
    this.query.typed(() => this.load());
  }

  load(n = 0): void {
    const id = this.query.begin();
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
        next: (p) => {
          if (this.query.isCurrent(id)) this.page.set(p);
        },
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

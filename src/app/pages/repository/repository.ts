import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { blobUrl, saveBlob } from '../../core/files';
import { LocalDatePipe } from '../../core/local-date.pipe';
import { CouncilTypeDto, Page, RepositoryMinutesDto, VerificationDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-repository',
  imports: [FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './repository.html',
})
export class RepositoryPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  number = '';
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
    this.api.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.load();
  }

  ngOnDestroy(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  load(n = 0): void {
    this.api
      .searchRepository({
        number: this.number,
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

  download(id: number, number: string): void {
    this.api.downloadMinutes(id).subscribe({
      next: (b) => saveBlob(b, `minutes-${number}.pdf`),
      error: (e) => this.toast.apiError(e),
    });
  }
}

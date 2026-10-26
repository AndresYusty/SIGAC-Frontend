import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Page } from '@core/http/api.models';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/ui/toast.service';
import { AgreementSummaryDto, AgreementTypeDto } from '@modules/agreements';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl, saveBlob } from '@shared/utils/files';
import { LiveQuery } from '@shared/utils/live-query';
import { RepositoryApi } from '../../repository.api';
import { RepositoryMinutesDto } from '../../repository.models';

type Shelf = 'minutes' | 'agreements';


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
  private readonly i18n = inject(I18nService);
  readonly section = signal<Shelf>('minutes');
  serialNumber = '';
  text = '';
  councilTypeId: number | '' = '';
  from = '';
  to = '';
  year: number | null = null;
  typeCode = '';
  agreementText = '';
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly agreementTypes = signal<AgreementTypeDto[]>([]);
  readonly minutesPage = signal<Page<RepositoryMinutesDto> | null>(null);
  readonly agreementsPage = signal<Page<AgreementSummaryDto> | null>(null);
  readonly viewerTitle = signal('');
  readonly pdf = signal<SafeResourceUrl | undefined>(undefined);
  private rawPdf?: string;
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.usersApi.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.api.agreementTypes().subscribe({ next: (t) => this.agreementTypes.set(t), error: () => undefined });
    this.load();
  }

  ngOnDestroy(): void {
    this.query.cancel();
    this.clearPdf();
  }

  show(section: Shelf): void {
    if (this.section() === section) return;
    this.section.set(section);
    this.clearPdf();
    this.load();
  }

  apply(): void {
    this.query.immediate(() => this.load());
  }

  applyText(): void {
    this.query.typed(() => this.load());
  }

  load(n = 0): void {
    if (this.section() === 'minutes') this.loadMinutes(n);
    else this.loadAgreements(n);
  }

  typeName(type: AgreementTypeDto): string {
    return this.i18n.lang() === 'en' ? type.nameEn : type.name;
  }

  viewMinutes(item: RepositoryMinutesDto): void {
    this.viewerTitle.set(item.serialNumber);
    this.open(this.api.viewMinutes(item.id));
  }

  downloadMinutes(item: RepositoryMinutesDto): void {
    this.api.downloadMinutes(item.id).subscribe({
      next: (b) => saveBlob(b, `Acta ${item.serialNumber}.pdf`),
      error: (e) => this.toast.apiError(e),
    });
  }

  viewAgreement(item: AgreementSummaryDto): void {
    this.viewerTitle.set(item.label);
    this.open(this.api.viewAgreement(item.id));
  }

  downloadAgreement(item: AgreementSummaryDto): void {
    this.api.downloadAgreement(item.id).subscribe({
      next: (b) => saveBlob(b, `${item.label}.pdf`),
      error: (e) => this.toast.apiError(e),
    });
  }

  private loadMinutes(n: number): void {
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
          if (this.query.isCurrent(id)) this.minutesPage.set(p);
        },
        error: (e) => this.toast.apiError(e),
      });
  }

  private loadAgreements(n: number): void {
    const id = this.query.begin();
    const year = this.year && this.year > 0 ? this.year : null;
    this.api.searchAgreements({ year, typeCode: this.typeCode, text: this.agreementText, page: n }).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.agreementsPage.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  private open(request: Observable<Blob>): void {
    request.subscribe({
      next: (b) => {
        this.clearPdf();
        this.rawPdf = blobUrl(b);
        this.pdf.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf));
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  private clearPdf(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
    this.rawPdf = undefined;
    this.pdf.set(undefined);
  }
}

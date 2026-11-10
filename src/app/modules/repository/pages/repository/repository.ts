import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '@core/http/api.models';
import { I18nService } from '@core/i18n/i18n.service';
import { DocumentViewerService } from '@core/ui/document-viewer.service';
import { ToastService } from '@core/ui/toast.service';
import { AgreementSummaryDto, AgreementTypeDto } from '@modules/agreements';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { saveBlob } from '@shared/utils/files';
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
  private readonly docs = inject(DocumentViewerService);
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
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.usersApi.listCouncilTypes().subscribe({ next: (t) => this.councilTypes.set(t) });
    this.api.agreementTypes().subscribe({ next: (t) => this.agreementTypes.set(t), error: () => undefined });
    this.load();
  }

  ngOnDestroy(): void {
    this.query.cancel();
  }

  show(section: Shelf): void {
    if (this.section() === section) return;
    this.section.set(section);
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
    this.docs.show(this.api.viewMinutes(item.id), `Acta ${item.serialNumber}.pdf`);
  }

  downloadMinutes(item: RepositoryMinutesDto): void {
    this.api.downloadMinutes(item.id).subscribe({
      next: (b) => saveBlob(b, `Acta ${item.serialNumber}.pdf`),
      error: (e) => this.toast.apiError(e),
    });
  }

  viewAgreement(item: AgreementSummaryDto): void {
    this.docs.show(this.api.viewAgreement(item.id), `${item.label}.pdf`);
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

}

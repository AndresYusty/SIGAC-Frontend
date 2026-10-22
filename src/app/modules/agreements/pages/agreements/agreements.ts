import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AGREEMENT_WRITERS } from '@core/auth/role-groups';
import { Page } from '@core/http/api.models';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { filenameFromDisposition, saveBlob } from '@shared/utils/files';
import { LiveQuery } from '@shared/utils/live-query';
import { AgreementsApi } from '../../agreements.api';
import { AgreementSummaryDto, AgreementTypeDto } from '../../agreements.models';

@Component({
  selector: 'app-agreements',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './agreements.html',
})
export class AgreementsPage implements OnInit, OnDestroy {
  private readonly api = inject(AgreementsApi);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18nService);
  readonly canWrite = inject(AuthService).has(...AGREEMENT_WRITERS);
  readonly types = signal<AgreementTypeDto[]>([]);
  readonly page = signal<Page<AgreementSummaryDto> | null>(null);
  year: number | null = new Date().getFullYear();
  typeCode = '';
  text = '';
  private readonly query = new LiveQuery();

  ngOnInit(): void {
    this.api.listTypes().subscribe({ next: (t) => this.types.set(t) });
    this.load();
  }

  ngOnDestroy(): void {
    this.query.cancel();
  }

  apply(): void {
    this.query.immediate(() => this.load());
  }

  applyText(): void {
    this.query.typed(() => this.load());
  }

  load(n = 0): void {
    const id = this.query.begin();
    this.api.list({ year: this.year, typeCode: this.typeCode, text: this.text }, n).subscribe({
      next: (p) => {
        if (this.query.isCurrent(id)) this.page.set(p);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  typeName(t: AgreementTypeDto): string {
    return this.i18n.lang() === 'en' ? t.nameEn : t.name;
  }

  download(a: AgreementSummaryDto): void {
    this.api.download(a.id).subscribe({
      next: (r) =>
        saveBlob(
          r.body!,
          filenameFromDisposition(r.headers.get('Content-Disposition'), `${a.label}.pdf`),
        ),
      error: (e) => this.toast.apiError(e),
    });
  }
}

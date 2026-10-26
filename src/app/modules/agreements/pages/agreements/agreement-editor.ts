import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '@core/auth/auth.service';
import { I18nService } from '@core/i18n/i18n.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl, filenameFromDisposition, saveBlob } from '@shared/utils/files';
import { AgreementsApi } from '../../agreements.api';
import {
  AgreementBlock,
  AgreementDefaultsDto,
  AgreementField,
  AgreementPayload,
  AgreementTypeDto,
  BlockType,
} from '../../agreements.models';

type Section = 'recitals' | 'articles';

const today = () => new Date().toLocaleDateString('en-CA');

@Component({
  selector: 'app-agreement-editor',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './agreement-editor.html',
})
export class AgreementEditorPage implements OnInit, OnDestroy {
  private readonly api = inject(AgreementsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(I18nService);
  readonly admin = inject(AuthService).has('ROLE_ADMIN');
  readonly sections: Section[] = ['recitals', 'articles'];

  readonly id = signal<number | null>(null);
  readonly label = signal('');
  readonly types = signal<AgreementTypeDto[]>([]);
  readonly defaults = signal<AgreementDefaultsDto | null>(null);
  readonly saving = signal(false);
  readonly pdf = signal<SafeResourceUrl | null>(null);
  readonly typeCode = signal('');
  readonly type = computed(() => this.types().find((t) => t.code === this.typeCode()));

  model: AgreementPayload = this.empty();
  private rawPdf?: string;
  private timer?: number;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')) || null;
    this.id.set(id);
    this.api.listTypes().subscribe({
      next: (types) => {
        this.types.set(types);
        if (id) {
          this.load(id);
        } else {
          this.api.defaults().subscribe({
            next: (d) => {
              this.defaults.set(d);
              this.model.councilTitle = d.councilTitle;
              this.model.presidentName = d.presidentName;
              this.model.secretaryName = d.secretaryName;
              this.selectType(types[0].code);
            },
            error: (e) => this.toast.apiError(e),
          });
        }
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.timer);
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  typeName(t: AgreementTypeDto): string {
    return this.i18n.lang() === 'en' ? t.nameEn : t.name;
  }

  fieldLabel(f: AgreementField): string {
    return this.i18n.lang() === 'en' ? f.labelEn : f.label;
  }

  async changeType(code: string): Promise<void> {
    const previous = this.typeCode();
    const typed = Object.entries(this.model.values).some(([k, v]) => k !== 'facultyName' && v?.trim());
    if (
      typed &&
      !(await this.confirm.ask('agreements.changeTypeTitle', 'agreements.changeTypeMessage'))
    ) {
      this.typeCode.set('');
      this.typeCode.set(previous);
      return;
    }
    this.selectType(code);
  }

  /** Loads the texts of the type; values already typed for fields with the same name are kept. */
  selectType(code: string): void {
    const t = this.types().find((x) => x.code === code);
    if (!t) return;
    this.typeCode.set(code);
    const values: Record<string, string> = {};
    for (const f of t.fields) values[f.key] = this.model.values[f.key] ?? '';
    if (values['facultyName'] === '' && this.defaults()) {
      values['facultyName'] = this.defaults()!.faculty.replace(/^facultad de\s+/i, '');
    }
    this.model = {
      ...this.model,
      typeCode: code,
      subject: t.subject,
      legalBasis: t.legalBasis,
      closing: t.closing,
      values,
      recitals: copy(t.recitals),
      articles: copy(t.articles),
    };
    this.refresh(0);
  }

  fillExamples(): void {
    for (const f of this.type()?.fields ?? []) {
      if (!this.model.values[f.key]) this.model.values[f.key] = f.example;
    }
    this.refresh(0);
  }

  addBlock(section: Section, type: BlockType): void {
    const block: AgreementBlock =
      type === 'table' ? { type, columns: ['', ''], rows: [['', '']] } : { type, text: '' };
    this.model[section].push(block);
    this.refresh();
  }

  removeBlock(section: Section, i: number): void {
    this.model[section].splice(i, 1);
    this.refresh();
  }

  moveBlock(section: Section, i: number, step: number): void {
    const list = this.model[section];
    const j = i + step;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.refresh();
  }

  addRow(b: AgreementBlock): void {
    b.rows = [...(b.rows ?? []), (b.columns ?? []).map(() => '')];
    this.refresh();
  }

  removeRow(b: AgreementBlock, i: number): void {
    b.rows!.splice(i, 1);
    this.refresh();
  }

  addColumn(b: AgreementBlock): void {
    b.columns = [...(b.columns ?? []), ''];
    b.rows = (b.rows ?? []).map((r) => [...r, '']);
    this.refresh();
  }

  removeColumn(b: AgreementBlock, c: number): void {
    b.columns!.splice(c, 1);
    b.rows!.forEach((r) => r.splice(c, 1));
    this.refresh();
  }

  /** Waits until the user stops typing before asking the server for a new PDF. */
  refresh(delay = 700): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.preview(), delay);
  }

  preview(): void {
    if (!this.model.typeCode || !this.model.issueDate) return;
    this.api.preview(this.model).subscribe({
      next: (b) => {
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(`${this.rawPdf}#toolbar=0&navpanes=0`),
        );
      },
      error: () => this.pdf.set(null),
    });
  }

  async remove(): Promise<void> {
    const id = this.id();
    if (!id) return;
    if (!(await this.confirm.ask('records.deleteTitle', 'records.deleteAgreement', 'records.remove', { code: this.label() }))) return;
    this.api.delete(id).subscribe({
      next: () => {
        this.toast.ok('records.deleted');
        void this.router.navigate(['/agreements']);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  save(): void {
    this.saving.set(true);
    const id = this.id();
    const request = id ? this.api.update(id, this.model) : this.api.create(this.model);
    request.subscribe({
      next: (a) => {
        this.saving.set(false);
        this.confirm.tell(this.i18n.t('agreements.toast.saved', { label: a.label }), true);
        if (!id) {
          this.router.navigate(['/agreements', a.id], { replaceUrl: true });
          this.id.set(a.id);
        }
        this.label.set(a.label);
        this.model.number = a.number;
      },
      error: (e) => {
        this.saving.set(false);
        this.confirm.tell(this.toast.apiErrorText(e));
      },
    });
  }

  download(): void {
    const id = this.id();
    if (!id) return;
    this.api.download(id).subscribe({
      next: (r) =>
        saveBlob(
          r.body!,
          filenameFromDisposition(r.headers.get('Content-Disposition'), `${this.label()}.pdf`),
        ),
      error: (e) => this.toast.apiError(e),
    });
  }

  trackIndex(i: number): number {
    return i;
  }

  private load(id: number): void {
    this.api.get(id).subscribe({
      next: (a) => {
        this.label.set(a.label);
        this.typeCode.set(a.typeCode);
        this.model = {
          typeCode: a.typeCode,
          number: a.number,
          issueDate: a.issueDate,
          subject: a.subject,
          councilTitle: a.councilTitle,
          legalBasis: a.legalBasis ?? '',
          closing: a.closing ?? '',
          presidentName: a.presidentName ?? '',
          secretaryName: a.secretaryName ?? '',
          values: { ...a.values },
          recitals: a.recitals,
          articles: a.articles,
        };
        this.refresh(0);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  private empty(): AgreementPayload {
    return {
      typeCode: '',
      number: null,
      issueDate: today(),
      subject: '',
      councilTitle: '',
      legalBasis: '',
      closing: '',
      presidentName: '',
      secretaryName: '',
      values: {},
      recitals: [],
      articles: [],
    };
  }
}

function copy(blocks: AgreementBlock[]): AgreementBlock[] {
  return blocks.map((b) => ({
    ...b,
    columns: b.columns ? [...b.columns] : b.columns,
    rows: b.rows?.map((r) => [...r]),
  }));
}

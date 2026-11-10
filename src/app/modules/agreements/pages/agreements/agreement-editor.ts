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
import { applyTableRows, buildTables, EditableTable, fieldsHiddenByTables } from '../../agreement-tables';
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
  private previewBlob: Blob | null = null;
  readonly typeCode = signal('');
  readonly type = computed(() => this.types().find((t) => t.code === this.typeCode()));
  readonly memo = computed(() => this.type()?.kind === 'MEMORANDUM');
  /** Selector options: blank documents first, then agreement models, then memorandum models. */
  readonly typeGroups = computed(() => {
    const all = this.types();
    const blank = (t: AgreementTypeDto) => t.code.startsWith('BLANK_');
    return [
      { key: 'blank', types: all.filter(blank) },
      { key: 'agreements', types: all.filter((t) => !blank(t) && t.kind !== 'MEMORANDUM') },
      { key: 'memos', types: all.filter((t) => !blank(t) && t.kind === 'MEMORANDUM') },
    ].filter((group) => group.types.length > 0);
  });
  readonly visibleSections = computed<Section[]>(() => (this.memo() ? ['recitals'] : this.sections));
  readonly nextNumber = computed(() => {
    const d = this.defaults();
    return d ? (this.memo() ? d.nextMemoNumber : d.nextNumber) : '';
  });
  readonly tables = signal<EditableTable[]>([]);
  readonly hiddenFields = computed(() => {
    const current = this.type();
    return current ? fieldsHiddenByTables(current) : new Set<string>();
  });

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
              const requested = this.route.snapshot.queryParamMap.get('type');
              const initial = types.find((t) => t.code === requested) ?? types[0];
              this.selectType(initial.code);
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
    const d = this.defaults();
    if (values['facultyName'] === '' && d) {
      values['facultyName'] = d.faculty.replace(/^facultad de\s+/i, '');
    }
    const memo = t.kind === 'MEMORANDUM';
    let councilTitle = this.model.councilTitle;
    if (d && (!councilTitle || councilTitle === d.councilTitle || councilTitle === d.memoFrom)) {
      councilTitle = memo ? d.memoFrom : d.councilTitle;
    }
    this.model = {
      ...this.model,
      typeCode: code,
      councilTitle,
      subject: t.subject,
      legalBasis: t.legalBasis,
      closing: t.closing,
      values,
      recitals: copy(t.recitals),
      articles: copy(t.articles),
    };
    this.tables.set(buildTables(t));
    this.applyTables();
    this.refresh(0);
  }

  fillExamples(): void {
    const hidden = this.hiddenFields();
    for (const f of this.type()?.fields ?? []) {
      if (hidden.has(f.key)) continue;
      if (!this.model.values[f.key]) this.model.values[f.key] = f.example;
    }
    this.refresh(0);
  }

  addBlock(section: Section, type: BlockType): void {
    if (type === 'table') return;
    this.model[section].push({ type, text: '' });
    this.refresh();
  }

  removeBlock(section: Section, index: number): void {
    this.model[section].splice(index, 1);
    this.refresh();
  }

  moveBlock(section: Section, index: number, step: number): void {
    const list = this.model[section];
    const next = index + step;
    if (next < 0 || next >= list.length) return;
    [list[index], list[next]] = [list[next], list[index]];
    this.refresh();
  }

  columnLabel(column: string): string {
    return column.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key: string) => this.model.values[key]?.trim() || key);
  }

  addTableRow(index: number): void {
    this.tables.update((tables) => tables.map((table, i) => i === index
      ? { ...table, rows: [...table.rows, table.columns.map(() => '')] }
      : table));
    this.refresh(0);
  }

  removeTableRow(tableIndex: number, rowIndex: number): void {
    this.tables.update((tables) => tables.map((table, i) => {
      if (i !== tableIndex) return table;
      const rows = table.rows.filter((_, row) => row !== rowIndex);
      return { ...table, rows: rows.length ? rows : [table.columns.map(() => '')] };
    }));
    this.refresh(0);
  }

  patchCell(tableIndex: number, rowIndex: number, columnIndex: number, value: string): void {
    this.tables.update((tables) => tables.map((table, i) => {
      if (i !== tableIndex) return table;
      const rows = table.rows.map((row, r) => r === rowIndex
        ? row.map((cell, c) => c === columnIndex ? value : cell)
        : row);
      return { ...table, rows };
    }));
  }

  /** Waits until the user stops typing before asking the server for a new PDF. */
  refresh(delay = 700): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.preview(), delay);
  }

  preview(): void {
    if (!this.model.typeCode || !this.model.issueDate) return;
    this.applyTables();
    this.api.preview(this.model).subscribe({
      next: (b) => {
        this.previewBlob = b;
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(`${this.rawPdf}#toolbar=0&navpanes=0`),
        );
      },
      error: () => {
        this.previewBlob = null;
        this.pdf.set(null);
      },
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
    this.applyTables();
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

  downloadPreview(): void {
    if (!this.previewBlob) return;
    saveBlob(this.previewBlob, `${this.label() || 'acuerdo'}.pdf`);
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

  private applyTables(): void {
    this.model.recitals = applyTableRows(this.model.recitals, this.tables());
    this.model.articles = applyTableRows(this.model.articles, this.tables());
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
        const current = this.types().find((t) => t.code === a.typeCode);
        this.tables.set(current ? buildTables(current, [...a.recitals, ...a.articles]) : []);
        this.applyTables();
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

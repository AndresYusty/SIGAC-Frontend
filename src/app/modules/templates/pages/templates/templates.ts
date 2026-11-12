import { Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/ui/toast.service';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl, saveBlob } from '@shared/utils/files';
import { TemplatesApi } from '../../templates.api';
import { TemplateDto, TemplateVariableDto } from '../../templates.models';

@Component({
  selector: 'app-templates',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './templates.html',
})
export class TemplatesPage implements OnInit, OnDestroy {
  private readonly api = inject(TemplatesApi);
  private readonly usersApi = inject(UsersApi);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly editorCard = viewChild<ElementRef<HTMLElement>>('editorCard');

  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly list = signal<TemplateDto[]>([]);
  readonly variables = signal<TemplateVariableDto[]>([]);
  readonly loadingList = signal(false);
  readonly loadingEditor = signal(false);
  readonly saving = signal(false);
  readonly previewing = signal(false);
  readonly selectedId = signal<number | null>(null);
  readonly selectedVersion = signal<number | null>(null);
  readonly councilTypeId = signal<number | null>(null);
  readonly name = signal('');
  readonly comment = signal('');
  readonly content = signal('');
  readonly pdf = signal<SafeResourceUrl | null>(null);

  private rawPdf?: string;
  private previewBlob?: Blob;
  private openSeq = 0;

  ngOnInit(): void {
    this.name.set(this.i18n.t('templates.defaultName'));
    this.usersApi.listCouncilTypes().subscribe({
      next: (types) => {
        this.councilTypes.set(types);
        const first = types[0]?.id ?? null;
        this.councilTypeId.set(first);
        if (first != null) this.loadList(true);
      },
      error: (e) => this.toast.apiError(e),
    });
    this.api.listTemplateVariables().subscribe({
      next: (v) => this.variables.set(v),
      error: () => undefined,
    });
  }

  ngOnDestroy(): void {
    this.revokePdf();
  }

  changeCouncilType(id: number | null): void {
    this.councilTypeId.set(id);
    this.resetEditor();
    if (id != null) this.loadList(true);
    else this.list.set([]);
  }

  loadList(openActive = false): void {
    const typeId = this.councilTypeId();
    if (typeId == null) return;
    this.loadingList.set(true);
    this.api.listTemplates(typeId).subscribe({
      next: (items) => {
        this.loadingList.set(false);
        this.list.set(items);
        if (openActive) {
          const active = items.find((t) => t.active) ?? items[0];
          if (active) this.open(active);
          else this.resetEditor();
        }
      },
      error: (e) => {
        this.loadingList.set(false);
        this.toast.apiError(e);
      },
    });
  }

  open(template: TemplateDto): void {
    if (this.loadingEditor() && this.selectedId() === template.id) return;
    const seq = ++this.openSeq;
    this.loadingEditor.set(true);
    this.selectedId.set(template.id);
    this.selectedVersion.set(template.version);
    this.revokePdf();
    this.api.getTemplate(template.id).subscribe({
      next: (d) => {
        if (seq !== this.openSeq) return;
        this.name.set(d.name);
        this.comment.set(d.comment ?? '');
        this.content.set(d.content ?? '');
        this.councilTypeId.set(d.councilTypeId);
        this.selectedVersion.set(d.version);
        this.loadingEditor.set(false);
        window.setTimeout(() => this.editorCard()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      },
      error: (e) => {
        if (seq !== this.openSeq) return;
        this.loadingEditor.set(false);
        this.toast.apiError(e);
      },
    });
  }

  startNew(): void {
    this.openSeq++;
    this.resetEditor();
    this.editorCard()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  save(): void {
    const typeId = this.councilTypeId();
    if (!typeId || this.saving() || this.loadingEditor()) return;
    const body = this.content().trim();
    if (!body) {
      this.toast.error('templates.toast.contentRequired');
      return;
    }
    this.saving.set(true);
    this.api
      .saveTemplate({
        councilTypeId: typeId,
        facultyId: null,
        name: this.name().trim() || this.i18n.t('templates.defaultName'),
        content: this.content(),
        comment: this.comment(),
      })
      .subscribe({
        next: (template) => {
          this.saving.set(false);
          this.toast.ok('templates.toast.saved', { version: template.version });
          this.selectedId.set(template.id);
          this.selectedVersion.set(template.version);
          this.name.set(template.name);
          this.comment.set(template.comment ?? '');
          this.content.set(template.content ?? this.content());
          this.loadList(false);
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.apiError(e);
        },
      });
  }

  activate(id: number, event?: Event): void {
    event?.stopPropagation();
    this.api.activateTemplate(id).subscribe({
      next: () => {
        this.toast.ok('templates.toast.activated');
        this.loadList(false);
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  preview(): void {
    if (this.previewing() || this.loadingEditor()) return;
    const body = this.content().trim();
    if (!body) {
      this.toast.error('templates.toast.contentRequired');
      return;
    }
    this.previewing.set(true);
    this.api.previewTemplate(this.content()).subscribe({
      next: (b) => {
        this.previewing.set(false);
        this.previewBlob = b;
        this.revokePdf();
        this.rawPdf = blobUrl(b);
        this.pdf.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf));
      },
      error: (e) => {
        this.previewing.set(false);
        this.toast.apiError(e);
      },
    });
  }

  downloadPreview(): void {
    if (!this.previewBlob) return;
    saveBlob(this.previewBlob, `${this.name() || 'plantilla'}.pdf`);
  }

  insertVariable(name: string): void {
    const token = '${' + name + '}';
    this.content.update((current) => (current ? current + token : token));
  }

  private resetEditor(): void {
    this.loadingEditor.set(false);
    this.selectedId.set(null);
    this.selectedVersion.set(null);
    this.name.set(this.i18n.t('templates.defaultName'));
    this.comment.set('');
    this.content.set('');
    this.revokePdf();
  }

  private revokePdf(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
    this.rawPdf = undefined;
    this.previewBlob = undefined;
    this.pdf.set(null);
  }
}

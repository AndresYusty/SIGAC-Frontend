import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/ui/toast.service';
import { CouncilTypeDto, UsersApi } from '@modules/users';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { blobUrl } from '@shared/utils/files';
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
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly list = signal<TemplateDto[]>([]);
  readonly variables = signal<TemplateVariableDto[]>([]);
  councilTypeId: number | null = null;
  facultyId: number | null = null;
  name = this.i18n.t('templates.defaultName');
  comment = '';
  content = '';
  selected?: number;
  pdf?: SafeResourceUrl;
  private rawPdf?: string;

  ngOnInit(): void {
    this.usersApi.listCouncilTypes().subscribe({
      next: (types) => {
        this.councilTypes.set(types);
        this.councilTypeId = types[0]?.id ?? null;
        this.load();
      },
    });
    this.api.listTemplateVariables().subscribe({ next: (v) => this.variables.set(v) });
  }

  ngOnDestroy(): void {
    if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
  }

  loadAgreementDraft(): void {
    this.api.agreementDraft().subscribe({
      next: (content) => {
        this.selected = undefined;
        this.name = this.i18n.t('templates.agreementDraftName');
        this.comment = this.i18n.t('templates.agreementDraftComment');
        this.content = content;
        this.preview();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  load(): void {
    this.api.listTemplates(this.councilTypeId ?? undefined).subscribe({
      next: (l) => this.list.set(l),
      error: (e) => this.toast.apiError(e),
    });
  }

  open(template: TemplateDto): void {
    this.api.getTemplate(template.id).subscribe({
      next: (d) => {
        this.selected = d.id;
        this.name = d.name;
        this.comment = d.comment ?? '';
        this.content = d.content ?? '';
        this.councilTypeId = d.councilTypeId;
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  save(): void {
    if (!this.councilTypeId) return;
    this.api
      .saveTemplate({
        councilTypeId: this.councilTypeId,
        facultyId: this.facultyId,
        name: this.name,
        content: this.content,
        comment: this.comment,
      })
      .subscribe({
        next: (template) => {
          this.toast.ok('templates.toast.saved', { version: template.version });
          this.load();
          this.open(template);
        },
        error: (e) => this.toast.apiError(e),
      });
  }

  activate(id: number): void {
    this.api.activateTemplate(id).subscribe({
      next: () => {
        this.toast.ok('templates.toast.activated');
        this.load();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  preview(): void {
    this.api.previewTemplate(this.content).subscribe({
      next: (b) => {
        if (this.rawPdf) URL.revokeObjectURL(this.rawPdf);
        this.rawPdf = blobUrl(b);
        this.pdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdf);
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}

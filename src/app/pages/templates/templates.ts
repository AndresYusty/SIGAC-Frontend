import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { saveBlob } from '../../core/files';
import { I18nService } from '../../core/i18n.service';
import { CouncilTypeDto, TemplateDto, TemplateVariableDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-templates',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './templates.html',
})
export class TemplatesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  readonly councilTypes = signal<CouncilTypeDto[]>([]);
  readonly list = signal<TemplateDto[]>([]);
  readonly variables = signal<TemplateVariableDto[]>([]);
  readonly errors = signal<string[]>([]);
  councilTypeId: number | null = null;
  facultyId: number | null = null;
  name = this.i18n.t('templates.defaultName');
  comment = '';
  content = '';
  selected?: number;

  ngOnInit(): void {
    this.api.listCouncilTypes().subscribe({
      next: (types) => {
        this.councilTypes.set(types);
        this.councilTypeId = types[0]?.id ?? null;
        this.load();
      },
    });
    this.api.listTemplateVariables().subscribe({ next: (v) => this.variables.set(v) });
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

  validate(): void {
    this.api.validateTemplate(this.content).subscribe({
      next: (errors) => {
        this.errors.set(errors);
        if (!errors.length) this.toast.ok('templates.toast.valid');
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
      next: (b) => saveBlob(b, 'template-preview.pdf'),
      error: (e) => this.toast.apiError(e),
    });
  }
}

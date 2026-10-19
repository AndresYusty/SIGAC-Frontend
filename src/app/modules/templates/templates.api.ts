import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { toQuery } from '@core/http/http-utils';
import { environment } from '../../../environments/environment';
import { TemplateDto, TemplatePayload, TemplateVariableDto } from './templates.models';

@Injectable({ providedIn: 'root' })
export class TemplatesApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listTemplates(councilTypeId?: number) {
    return this.http.get<TemplateDto[]>(`${this.base}/templates`, {
      params: toQuery({ councilTypeId }),
    });
  }
  getTemplate(id: number) {
    return this.http.get<TemplateDto>(`${this.base}/templates/${id}`);
  }
  listTemplateVariables() {
    return this.http.get<TemplateVariableDto[]>(`${this.base}/templates/variables`);
  }
  saveTemplate(body: TemplatePayload) {
    return this.http.post<TemplateDto>(`${this.base}/templates`, body);
  }
  activateTemplate(id: number) {
    return this.http.put<TemplateDto>(`${this.base}/templates/${id}/activate`, {});
  }
  previewTemplate(content: string) {
    return this.http.post(`${this.base}/templates/preview`, { content }, { responseType: 'blob' });
  }
  agreementDraft() {
    return this.http.get(`${this.base}/templates/samples/agreement`, { responseType: 'text' });
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Page } from '@core/http/api.models';
import { toQuery } from '@core/http/http-utils';
import { environment } from '../../../environments/environment';
import {
  AgreementDefaultsDto,
  AgreementDto,
  AgreementPayload,
  AgreementSummaryDto,
  AgreementTypeDto,
} from './agreements.models';

@Injectable({ providedIn: 'root' })
export class AgreementsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/agreements`;

  listTypes() {
    return this.http.get<AgreementTypeDto[]>(`${this.base}/types`);
  }
  defaults() {
    return this.http.get<AgreementDefaultsDto>(`${this.base}/defaults`);
  }
  list(filters: { year?: number | null; typeCode?: string; text?: string }, page = 0, size = 20) {
    return this.http.get<Page<AgreementSummaryDto>>(this.base, {
      params: toQuery({ ...filters, page, size }),
    });
  }
  get(id: number) {
    return this.http.get<AgreementDto>(`${this.base}/${id}`);
  }
  create(body: AgreementPayload) {
    return this.http.post<AgreementDto>(this.base, body);
  }
  update(id: number, body: AgreementPayload) {
    return this.http.put<AgreementDto>(`${this.base}/${id}`, body);
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  preview(body: AgreementPayload) {
    return this.http.post(`${this.base}/preview`, body, { responseType: 'blob' });
  }
  download(id: number) {
    return this.http.get(`${this.base}/${id}/pdf`, { observe: 'response', responseType: 'blob' });
  }
}

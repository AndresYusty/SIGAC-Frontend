import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Page } from '@core/http/api.models';
import { toQuery } from '@core/http/http-utils';
import { environment } from '../../../environments/environment';
import { MinutesDto, MinutesStatus } from './minutes.models';

@Injectable({ providedIn: 'root' })
export class MinutesApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listMinutes(status?: MinutesStatus | '', page = 0, size = 20) {
    return this.http.get<Page<MinutesDto>>(`${this.base}/minutes`, {
      params: toQuery({ status, page, size, sort: 'createdAt,desc' }),
    });
  }
  getMinutes(id: number) {
    return this.http.get<MinutesDto>(`${this.base}/minutes/${id}`);
  }
  generateMinutes(sessionId: number) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/session/${sessionId}`, {});
  }
  updateMinutesContent(id: number, htmlContent: string) {
    return this.http.put<MinutesDto>(`${this.base}/minutes/${id}/content`, { htmlContent });
  }
  deleteMinutes(id: number) {
    return this.http.delete<void>(`${this.base}/minutes/${id}`);
  }
  previewMinutes(id: number) {
    return this.http.get(`${this.base}/minutes/${id}/preview`, { responseType: 'blob' });
  }
  sendMinutesForSignature(id: number) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/${id}/send-to-signature`, {});
  }
  rejectMinutes(id: number, note: string) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/${id}/reject`, { note });
  }
  signMinutes(id: number) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/${id}/approve-and-sign`, {});
  }
}

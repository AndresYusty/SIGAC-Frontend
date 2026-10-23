import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Page } from '@core/http/api.models';
import { toQuery } from '@core/http/http-utils';
import { environment } from '../../../environments/environment';
import {
  GuestPayload,
  RequestDto,
  RequestHistoryDto,
  RequestSearch,
  SessionDto,
  SummonedDto,
  SessionStatus,
  SessionSummaryDto,
} from './requests.models';

@Injectable({ providedIn: 'root' })
export class RequestsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  searchRequests(params: RequestSearch) {
    return this.http.get<Page<RequestDto>>(`${this.base}/requests`, {
      params: toQuery({ ...params, sort: 'filedAt,desc' }),
    });
  }
  getRequest(id: number) {
    return this.http.get<RequestDto>(`${this.base}/requests/${id}`);
  }
  getRequestHistory(id: number) {
    return this.http.get<RequestHistoryDto[]>(`${this.base}/requests/${id}/history`);
  }
  fileRequest(fd: FormData) {
    return this.http.post<RequestDto>(`${this.base}/requests`, fd);
  }
  updateRequest(id: number, fd: FormData) {
    return this.http.put<RequestDto>(`${this.base}/requests/${id}`, fd);
  }
  approveRequest(id: number) {
    return this.http.post<RequestDto>(`${this.base}/requests/${id}/approve`, {});
  }
  rejectRequest(id: number, reason: string) {
    return this.http.post<RequestDto>(`${this.base}/requests/${id}/reject`, { reason });
  }
  returnRequest(id: number, reason: string) {
    return this.http.post<RequestDto>(`${this.base}/requests/${id}/return`, { reason });
  }
  downloadAttachment(id: number, attachmentId: number) {
    return this.http.get(`${this.base}/requests/${id}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
  }

  listSessions(status?: SessionStatus | '', page = 0, size = 20, sort?: string) {
    return this.http.get<Page<SessionSummaryDto>>(`${this.base}/sessions`, {
      params: toQuery({ status, page, size, sort }),
    });
  }
  getSession(id: number) {
    return this.http.get<SessionDto>(`${this.base}/sessions/${id}`);
  }
  summonable() {
    return this.http.get<SummonedDto[]>(`${this.base}/sessions/summonable`);
  }
  createSession(councilTypeId: number, scheduledAt: string, location: string | null, memberIds: number[]) {
    return this.http.post<SessionDto>(`${this.base}/sessions`, {
      councilTypeId,
      scheduledAt,
      location,
      memberIds,
    });
  }
  addAgendaItem(sessionId: number, requestId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/items`, { requestId });
  }
  addUrgentItem(sessionId: number, title: string, description: string) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/urgent-items`, {
      title,
      description,
    });
  }
  addGuest(sessionId: number, guest: GuestPayload) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/guests`, guest);
  }
  removeGuest(sessionId: number, guestId: number) {
    return this.http.delete<SessionDto>(`${this.base}/sessions/${sessionId}/guests/${guestId}`);
  }
  removeAgendaItem(sessionId: number, itemId: number) {
    return this.http.delete<SessionDto>(`${this.base}/sessions/${sessionId}/items/${itemId}`);
  }
  reorderAgendaItems(sessionId: number, itemIds: number[]) {
    return this.http.put<SessionDto>(`${this.base}/sessions/${sessionId}/items/order`, {
      itemIds,
    });
  }
  closeAgenda(sessionId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/close-agenda`, {});
  }
  downloadNotice(sessionId: number) {
    return this.http.get(`${this.base}/sessions/${sessionId}/citacion`, { responseType: 'blob' });
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SessionDto } from '@modules/requests';
import { environment } from '../../../environments/environment';
import { AttendanceDto, DecisionPayload } from './session.models';

@Injectable({ providedIn: 'root' })
export class LiveSessionApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAttendance(sessionId: number) {
    return this.http.get<AttendanceDto>(`${this.base}/sessions/${sessionId}/attendance`);
  }
  saveAttendance(sessionId: number, items: { userId: number; present: boolean }[]) {
    return this.http.put<AttendanceDto>(`${this.base}/sessions/${sessionId}/attendance`, {
      items,
    });
  }
  startSession(sessionId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/start`, {});
  }
  suspendSession(sessionId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/suspend`, {});
  }
  resumeSession(sessionId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/resume`, {});
  }
  finishSession(sessionId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/finish`, {});
  }
  recordDecision(sessionId: number, itemId: number, body: DecisionPayload) {
    return this.http.post(`${this.base}/sessions/${sessionId}/items/${itemId}/decision`, body);
  }
  saveDebateNotes(sessionId: number, itemId: number, content: string) {
    return this.http.post(`${this.base}/sessions/${sessionId}/items/${itemId}/notes`, {
      content,
    });
  }
  addMiscItem(sessionId: number, title: string, description: string) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/misc-items`, {
      title,
      description,
    });
  }
}

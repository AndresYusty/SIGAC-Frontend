import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AttendanceDto,
  AuditLogDto,
  CouncilTypeDto,
  DashboardDto,
  DecisionResult,
  MinutesDto,
  MinutesStatus,
  NodeDto,
  Page,
  ParameterDto,
  RepositoryMinutesDto,
  RequestDto,
  RequestHistoryDto,
  RequestStatus,
  RoleName,
  SessionDto,
  SessionStatus,
  SessionSummaryDto,
  TemplateDto,
  TemplateVariableDto,
  UserDto,
  VerificationDto,
} from './models';
import { toQuery } from './http-utils';

export interface UserPayload {
  name: string;
  roles: RoleName[];
  facultyId: number | null;
  programId: number | null;
}

export interface NewUserPayload extends UserPayload {
  email: string;
  password: string;
}

export interface TemplatePayload {
  councilTypeId: number;
  facultyId: number | null;
  name: string;
  content: string;
  comment: string;
}

export interface RequestSearch {
  status?: RequestStatus | '';
  code?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface DecisionPayload {
  result: DecisionResult;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  changeReason?: string;
}

export interface RepositorySearch {
  number?: string;
  councilTypeId?: number | '';
  from?: string;
  to?: string;
  campusId?: number | '';
  facultyId?: number | '';
  text?: string;
  page?: number;
  size?: number;
}

export interface AuditSearch {
  event?: string;
  user?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  dashboard() {
    return this.http.get<DashboardDto>(`${this.base}/dashboard`);
  }

  listUsers(q = '', page = 0, size = 20) {
    return this.http.get<Page<UserDto>>(`${this.base}/users`, { params: toQuery({ q, page, size, sort: 'name' }) });
  }
  getUser(id: number) {
    return this.http.get<UserDto>(`${this.base}/users/${id}`);
  }
  createUser(body: NewUserPayload) {
    return this.http.post<UserDto>(`${this.base}/users`, body);
  }
  updateUser(id: number, body: UserPayload) {
    return this.http.put<UserDto>(`${this.base}/users/${id}`, body);
  }
  setUserActive(id: number, active: boolean) {
    return this.http.patch<UserDto>(`${this.base}/users/${id}/status`, null, { params: { active } });
  }

  listUniversities() {
    return this.http.get<NodeDto[]>(`${this.base}/hierarchy/universities`);
  }
  createUniversity(name: string) {
    return this.http.post<NodeDto>(`${this.base}/hierarchy/universities`, { name });
  }
  updateUniversity(id: number, name: string) {
    return this.http.put<NodeDto>(`${this.base}/hierarchy/universities/${id}`, { name });
  }
  listCampuses(universityId: number) {
    return this.http.get<NodeDto[]>(`${this.base}/hierarchy/campuses`, { params: { universityId } });
  }
  createCampus(name: string, city: string, universityId: number) {
    return this.http.post<NodeDto>(`${this.base}/hierarchy/campuses`, { name, city, universityId });
  }
  updateCampus(id: number, name: string, city: string, universityId: number) {
    return this.http.put<NodeDto>(`${this.base}/hierarchy/campuses/${id}`, { name, city, universityId });
  }
  listFaculties(campusId: number) {
    return this.http.get<NodeDto[]>(`${this.base}/hierarchy/faculties`, { params: { campusId } });
  }
  createFaculty(name: string, campusId: number) {
    return this.http.post<NodeDto>(`${this.base}/hierarchy/faculties`, { name, campusId });
  }
  updateFaculty(id: number, name: string, campusId: number) {
    return this.http.put<NodeDto>(`${this.base}/hierarchy/faculties/${id}`, { name, campusId });
  }
  listPrograms(facultyId: number) {
    return this.http.get<NodeDto[]>(`${this.base}/hierarchy/programs`, { params: { facultyId } });
  }
  createProgram(name: string, facultyId: number) {
    return this.http.post<NodeDto>(`${this.base}/hierarchy/programs`, { name, facultyId });
  }
  updateProgram(id: number, name: string, facultyId: number) {
    return this.http.put<NodeDto>(`${this.base}/hierarchy/programs/${id}`, { name, facultyId });
  }

  listCouncilTypes() {
    return this.http.get<CouncilTypeDto[]>(`${this.base}/council-types`);
  }
  createCouncilType(code: string, name: string) {
    return this.http.post<CouncilTypeDto>(`${this.base}/council-types`, { code, name });
  }
  updateCouncilType(id: number, code: string, name: string) {
    return this.http.put<CouncilTypeDto>(`${this.base}/council-types/${id}`, { code, name });
  }
  listParameters() {
    return this.http.get<ParameterDto[]>(`${this.base}/parameters`);
  }
  updateParameter(key: string, value: string) {
    return this.http.put<ParameterDto>(`${this.base}/parameters/${key}`, { value });
  }

  listTemplates(councilTypeId?: number) {
    return this.http.get<TemplateDto[]>(`${this.base}/templates`, { params: toQuery({ councilTypeId }) });
  }
  getTemplate(id: number) {
    return this.http.get<TemplateDto>(`${this.base}/templates/${id}`);
  }
  listTemplateVariables() {
    return this.http.get<TemplateVariableDto[]>(`${this.base}/templates/variables`);
  }
  validateTemplate(content: string) {
    return this.http.post<string[]>(`${this.base}/templates/validate`, { content });
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
    return this.http.get(`${this.base}/requests/${id}/attachments/${attachmentId}/download`, { responseType: 'blob' });
  }

  listSessions(status?: SessionStatus | '', page = 0, size = 20) {
    return this.http.get<Page<SessionSummaryDto>>(`${this.base}/sessions`, {
      params: toQuery({ status, page, size, sort: 'scheduledAt,desc' }),
    });
  }
  getSession(id: number) {
    return this.http.get<SessionDto>(`${this.base}/sessions/${id}`);
  }
  createSession(councilTypeId: number, scheduledAt: string, location: string) {
    return this.http.post<SessionDto>(`${this.base}/sessions`, { councilTypeId, scheduledAt, location });
  }
  addAgendaItem(sessionId: number, requestId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/items`, { requestId });
  }
  removeAgendaItem(sessionId: number, itemId: number) {
    return this.http.delete<SessionDto>(`${this.base}/sessions/${sessionId}/items/${itemId}`);
  }
  reorderAgendaItems(sessionId: number, itemIds: number[]) {
    return this.http.put<SessionDto>(`${this.base}/sessions/${sessionId}/items/order`, { itemIds });
  }
  closeAgenda(sessionId: number) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/close-agenda`, {});
  }
  downloadSummons(sessionId: number) {
    return this.http.get(`${this.base}/sessions/${sessionId}/summons`, { responseType: 'blob' });
  }
  getAttendance(sessionId: number) {
    return this.http.get<AttendanceDto>(`${this.base}/sessions/${sessionId}/attendance`);
  }
  saveAttendance(sessionId: number, items: { userId: number; present: boolean }[]) {
    return this.http.put<AttendanceDto>(`${this.base}/sessions/${sessionId}/attendance`, { items });
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
    return this.http.post(`${this.base}/sessions/${sessionId}/items/${itemId}/notes`, { content });
  }
  addMiscItem(sessionId: number, title: string, description: string) {
    return this.http.post<SessionDto>(`${this.base}/sessions/${sessionId}/misc-items`, { title, description });
  }

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
  updateMinutesContent(id: number, contentHtml: string) {
    return this.http.put<MinutesDto>(`${this.base}/minutes/${id}/content`, { contentHtml });
  }
  previewMinutes(id: number) {
    return this.http.get(`${this.base}/minutes/${id}/preview`, { responseType: 'blob' });
  }
  sendMinutesForSignature(id: number) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/${id}/send-for-signature`, {});
  }
  rejectMinutes(id: number, note: string) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/${id}/reject`, { note });
  }
  signMinutes(id: number) {
    return this.http.post<MinutesDto>(`${this.base}/minutes/${id}/approve-and-sign`, {});
  }

  searchRepository(params: RepositorySearch) {
    return this.http.get<Page<RepositoryMinutesDto>>(`${this.base}/repository/minutes`, {
      params: toQuery({ ...params, sort: 'sessionDate,desc' }),
    });
  }
  verifyMinutes(id: number) {
    return this.http.get<VerificationDto>(`${this.base}/repository/minutes/${id}/verify`);
  }
  viewMinutes(id: number) {
    return this.http.get(`${this.base}/repository/minutes/${id}/viewer`, { responseType: 'blob' });
  }
  downloadMinutes(id: number) {
    return this.http.get(`${this.base}/repository/minutes/${id}/download`, { responseType: 'blob' });
  }

  searchAudit(params: AuditSearch) {
    return this.http.get<Page<AuditLogDto>>(`${this.base}/audit`, { params: toQuery({ ...params }) });
  }
}

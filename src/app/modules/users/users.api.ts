import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserDto } from '@core/auth/auth.models';
import { Page } from '@core/http/api.models';
import { toQuery } from '@core/http/http-utils';
import { environment } from '../../../environments/environment';
import {
  CouncilTypeDto,
  LetterheadPart,
  LetterheadStatus,
  NewUserPayload,
  NodeDto,
  ParameterDto,
  UserPayload,
} from './users.models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listUsers(q = '', page = 0, size = 20) {
    return this.http.get<Page<UserDto>>(`${this.base}/users`, {
      params: toQuery({ q, page, size, sort: 'name' }),
    });
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
    return this.http.patch<UserDto>(`${this.base}/users/${id}/status`, null, {
      params: { active },
    });
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
  deleteUniversity(id: number) {
    return this.http.delete<void>(`${this.base}/hierarchy/universities/${id}`);
  }
  listCampuses(universityId: number) {
    return this.http.get<NodeDto[]>(`${this.base}/hierarchy/campuses`, {
      params: { universityId },
    });
  }
  createCampus(name: string, city: string, universityId: number) {
    return this.http.post<NodeDto>(`${this.base}/hierarchy/campuses`, {
      name,
      city,
      universityId,
    });
  }
  updateCampus(id: number, name: string, city: string, universityId: number) {
    return this.http.put<NodeDto>(`${this.base}/hierarchy/campuses/${id}`, {
      name,
      city,
      universityId,
    });
  }
  deleteCampus(id: number) {
    return this.http.delete<void>(`${this.base}/hierarchy/campuses/${id}`);
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
  deleteFaculty(id: number) {
    return this.http.delete<void>(`${this.base}/hierarchy/faculties/${id}`);
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
  deleteProgram(id: number) {
    return this.http.delete<void>(`${this.base}/hierarchy/programs/${id}`);
  }

  listCouncilTypes() {
    return this.http.get<CouncilTypeDto[]>(`${this.base}/council-types`);
  }
  renameCouncilType(id: number, name: string) {
    return this.http.put<CouncilTypeDto>(`${this.base}/council-types/${id}`, { name });
  }

  listParameters() {
    return this.http.get<ParameterDto[]>(`${this.base}/parameters`);
  }
  updateParameter(key: string, value: string) {
    return this.http.put<ParameterDto>(`${this.base}/parameters/${key}`, { value });
  }

  letterheadStatus() {
    return this.http.get<LetterheadStatus>(`${this.base}/letterhead`);
  }
  letterheadSheet() {
    return this.http.get(`${this.base}/letterhead/sheet`, { responseType: 'blob' });
  }
  letterheadLogo() {
    return this.http.get(`${this.base}/letterhead/logo`, { responseType: 'blob' });
  }
  uploadLetterhead(part: LetterheadPart, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.put<LetterheadStatus>(`${this.base}/letterhead/${part}`, body);
  }
  resetLetterhead(part: LetterheadPart) {
    return this.http.delete<LetterheadStatus>(`${this.base}/letterhead/${part}`);
  }
}

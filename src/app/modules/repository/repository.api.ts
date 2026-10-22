import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Page } from '@core/http/api.models';
import { toQuery } from '@core/http/http-utils';
import { environment } from '../../../environments/environment';
import {
  AuditLogDto,
  AuditSearch,
  DashboardDto,
  RepositoryMinutesDto,
  RepositorySearch,
} from './repository.models';

@Injectable({ providedIn: 'root' })
export class RepositoryApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  searchRepository(params: RepositorySearch) {
    return this.http.get<Page<RepositoryMinutesDto>>(`${this.base}/repository/minutes`, {
      params: toQuery({ ...params, sort: 'sessionDate,desc' }),
    });
  }
  viewMinutes(id: number) {
    return this.http.get(`${this.base}/repository/minutes/${id}/viewer`, { responseType: 'blob' });
  }
  downloadMinutes(id: number) {
    return this.http.get(`${this.base}/repository/minutes/${id}/download`, {
      responseType: 'blob',
    });
  }

  searchAudit(params: AuditSearch) {
    return this.http.get<Page<AuditLogDto>>(`${this.base}/audit`, {
      params: toQuery({ ...params }),
    });
  }

  dashboard() {
    return this.http.get<DashboardDto>(`${this.base}/dashboard`);
  }
}

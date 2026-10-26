import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Page } from '@core/http/api.models';
import { toQuery } from '@core/http/http-utils';
import { AgreementSummaryDto, AgreementTypeDto } from '@modules/agreements';
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

  agreementTypes() {
    return this.http.get<AgreementTypeDto[]>(`${this.base}/repository/agreements/types`);
  }
  searchAgreements(params: { year?: number | null; typeCode?: string; text?: string; page?: number; size?: number }) {
    return this.http.get<Page<AgreementSummaryDto>>(`${this.base}/repository/agreements`, {
      params: toQuery(params),
    });
  }
  viewAgreement(id: number) {
    return this.http.get(`${this.base}/repository/agreements/${id}/viewer`, { responseType: 'blob' });
  }
  downloadAgreement(id: number) {
    return this.http.get(`${this.base}/repository/agreements/${id}/download`, { responseType: 'blob' });
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

import { RequestStatus } from '@modules/requests';

export interface RepositoryMinutesDto {
  id: number;
  serialNumber: string;
  councilType: string;
  university: string;
  campus: string;
  faculty: string;
  sessionDate: string;
  signedBy: string;
  signedAt: string;
  sha256Hash: string;
}

export interface VerificationDto {
  serialNumber: string;
  storedHash: string;
  computedHash: string;
  intact: boolean;
}

export interface RepositorySearch {
  serialNumber?: string;
  councilTypeId?: number | '';
  from?: string;
  to?: string;
  campusId?: number | '';
  facultyId?: number | '';
  text?: string;
  page?: number;
  size?: number;
}

export interface AuditLogDto {
  id: number;
  event: string;
  userEmail: string;
  ip: string;
  entity: string;
  entityId: string;
  detail: string | null;
  occurredAt: string;
}

export interface AuditSearch {
  event?: string;
  user?: string;
  page?: number;
  size?: number;
}

export interface PublishedMinutesSummary {
  id: number;
  serialNumber: string;
  sessionDate: string;
}

export interface DashboardIndicators {
  myRequestsByStatus?: Partial<Record<RequestStatus, number>>;
  requestsPendingReview?: number;
  approvedRequestsWithoutAgenda?: number;
  upcomingSessions?: number;
  minutesInProgress?: number;
  minutesPendingSignature?: number;
  finishedSessions?: number;
  latestPublishedMinutes?: PublishedMinutesSummary[];
  activeUsers?: number;
  inactiveUsers?: number;
  publishedMinutesTotal?: number;
}

export interface DashboardDto {
  user: string;
  indicators: DashboardIndicators;
}

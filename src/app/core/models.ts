export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  active: boolean;
  roles: RoleName[];
  facultyId: number | null;
  facultyName: string | null;
  programId: number | null;
  programName: string | null;
  lastLogin: string | null;
}

export interface LoginResponse {
  token: string;
  type: string;
  expiresAt: string;
  user: UserDto;
}

export interface MessageResponse {
  message: string;
}

export type AuthSession = LoginResponse;

export interface NodeDto {
  id: number;
  name: string;
  parentId: number | null;
  city: string | null;
}

export interface CouncilTypeDto {
  id: number;
  code: string;
  name: string;
}

export interface ParameterDto {
  key: string;
  value: string;
  description: string;
}

export interface TemplateVariableDto {
  name: string;
  type: string;
  description: string;
  example: string;
}

export interface TemplateDto {
  id: number;
  name: string;
  councilTypeId: number;
  councilTypeName: string;
  facultyId: number | null;
  facultyName: string | null;
  version: number;
  active: boolean;
  comment: string | null;
  createdBy: string;
  createdAt: string;
  content: string | null;
}

export const REQUEST_TYPES = ['ACADEMIC', 'ADMINISTRATIVE', 'STUDENT', 'FACULTY'] as const;
export const REQUEST_STATUSES = ['FILED', 'RETURNED', 'REJECTED', 'APPROVED', 'ON_AGENDA', 'PROCESSED'] as const;
export const SESSION_STATUSES = ['SCHEDULED', 'CONVENED', 'STARTED', 'SUSPENDED', 'FINISHED'] as const;
export const MINUTES_STATUSES = ['DRAFT', 'EDITING', 'PENDING_SIGNATURE', 'PUBLISHED'] as const;
export const DECISION_RESULTS = ['APPROVED', 'DENIED', 'POSTPONED', 'CANCELLED'] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type MinutesStatus = (typeof MINUTES_STATUSES)[number];
export type DecisionResult = (typeof DECISION_RESULTS)[number];

export interface AttachmentDto {
  id: number;
  name: string;
  sizeBytes: number;
  sha256Hash: string;
}

export interface RequestDto {
  id: number;
  code: string;
  title: string;
  description: string;
  applicant: string;
  requestType: RequestType;
  status: RequestStatus;
  facultyId: number;
  faculty: string;
  programId: number | null;
  program: string | null;
  filedBy: string;
  filedAt: string;
  attachments: AttachmentDto[];
}

export interface RequestHistoryDto {
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  reason: string | null;
  user: string;
  date: string;
}

export interface SessionSummaryDto {
  id: number;
  councilType: string;
  faculty: string;
  scheduledAt: string;
  location: string;
  status: SessionStatus;
  agendaClosed: boolean;
  totalItems: number;
}

export interface AgendaItemDto {
  id: number;
  order: number;
  title: string;
  description: string | null;
  requestCode: string | null;
  isMisc: boolean;
  result: DecisionResult | null;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  decidedBy: string | null;
  debateNotes: string | null;
}

export interface SessionDto {
  id: number;
  councilTypeId: number;
  councilType: string;
  facultyId: number;
  faculty: string;
  scheduledAt: string;
  location: string;
  status: SessionStatus;
  agendaClosed: boolean;
  actualStart: string | null;
  actualEnd: string | null;
  items: AgendaItemDto[];
}

export interface QuorumDto {
  members: number;
  present: number;
  required: number;
  percentage: number;
  reached: boolean;
}

export interface AttendeeDto {
  userId: number;
  name: string;
  role: RoleName;
  present: boolean;
}

export interface AttendanceDto {
  sessionStatus: SessionStatus;
  quorum: QuorumDto;
  attendees: AttendeeDto[];
}

export interface MinutesDto {
  id: number;
  number: string;
  status: MinutesStatus;
  sessionId: number;
  councilType: string;
  faculty: string;
  sessionDate: string;
  rejectionNote: string | null;
  signedBy: string | null;
  signedAt: string | null;
  contentHtml: string | null;
}

export interface RepositoryMinutesDto {
  id: number;
  number: string;
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
  number: string;
  storedHash: string;
  computedHash: string;
  intact: boolean;
}

export interface AuditLogDto {
  id: number;
  event: string;
  userEmail: string;
  ip: string;
  entity: string;
  entityId: string;
  detail: string | null;
  date: string;
}

export interface PublishedMinutesSummary {
  id: number;
  number: string;
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

export const ROLES = [
  'ROLE_ADMIN',
  'ROLE_DEV',
  'ROLE_SECRETARY_1',
  'ROLE_SECRETARY_2',
  'ROLE_PRESIDENT',
  'ROLE_COUNCILOR',
] as const;

export type RoleName = (typeof ROLES)[number];

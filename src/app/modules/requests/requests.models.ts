export const REQUEST_TYPES = ['ACADEMIC', 'ADMINISTRATIVE', 'STUDENT', 'FACULTY'] as const;
export const REQUEST_STATUSES = [
  'FILED',
  'RETURNED',
  'REJECTED',
  'APPROVED',
  'ON_AGENDA',
  'PROCESSED',
] as const;
export const SESSION_STATUSES = [
  'SCHEDULED',
  'CONVENED',
  'STARTED',
  'SUSPENDED',
  'FINISHED',
] as const;
export const DECISION_RESULTS = ['APPROVED', 'DENIED', 'POSTPONED', 'CANCELLED'] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
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

export interface RequestSearch {
  status?: RequestStatus | '';
  code?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
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

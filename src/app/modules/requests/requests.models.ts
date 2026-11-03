import { RoleName } from '@core/auth/auth.models';
import { CouncilKind } from '@modules/users';

export const REQUEST_BRANCHES = ['STUDENT', 'TEACHING', 'CURRICULUM', 'RESEARCH'] as const;
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
export const DECISION_OUTCOMES = ['APPROVED', 'DENIED', 'POSTPONED', 'CANCELLED'] as const;

export type RequestBranch = (typeof REQUEST_BRANCHES)[number];
export type RequestType = string;
export type CancellationKind = 'COURSE' | 'PERIOD';
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export interface AttachmentDto {
  id: number;
  name: string;
  sizeBytes: number;
  sha256Hash: string;
  documentCode: string | null;
}

export interface CourseLine {
  line: number;
  courseName: string;
  groupCode: string | null;
  subgroup: string | null;
  courseNumber: string | null;
  gradeNumber: string | null;
  gradeWords: string | null;
  attendedRegularly: boolean | null;
  failingCourse: boolean | null;
}

export interface TopicDto {
  code: RequestType;
  documents: string[];
  courses: boolean;
  grades: boolean;
  otherDetail: boolean;
  cancellationChoice: boolean;
}

export interface BranchDto {
  code: RequestBranch;
  topics: TopicDto[];
}

export interface RequestCatalog {
  faculty: string | null;
  campus: string | null;
  program: string | null;
  programId: number | null;
  branches: BranchDto[];
}

export interface RequestDto {
  id: number;
  code: string;
  title: string;
  description: string;
  requester: string;
  branch: RequestBranch;
  requestType: RequestType;
  cancellationKind: CancellationKind | null;
  status: RequestStatus;
  facultyId: number;
  faculty: string;
  campus: string | null;
  programId: number | null;
  program: string | null;
  filedBy: string;
  filedAt: string;
  filedOn: string | null;
  academicPeriod: string | null;
  studentCode: string | null;
  identityDocument: string | null;
  identityIssuedIn: string | null;
  email: string | null;
  phone: string | null;
  electronicNotice: boolean;
  counselorName: string | null;
  otherDetail: string | null;
  courses: CourseLine[];
  attachments: AttachmentDto[];
}

export interface RequestHistoryDto {
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  reason: string | null;
  user: string;
  occurredAt: string;
}

export interface RequestSearch {
  status?: RequestStatus | '';
  pending?: boolean;
  code?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface SessionSummaryDto {
  id: number;
  councilType: string;
  councilKind: CouncilKind;
  faculty: string;
  scheduledAt: string;
  location: string | null;
  status: SessionStatus;
  agendaClosed: boolean;
  totalItems: number;
}

export interface AgendaItemDto {
  id: number;
  position: number;
  title: string;
  description: string | null;
  requestCode: string | null;
  miscellaneous: boolean;
  urgent: boolean;
  outcome: DecisionOutcome | null;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  decidedBy: string | null;
  debateNotes: string | null;
}

/** Expanded council guest: has voice but no vote and does not count for the quorum. */
export interface GuestDto {
  id: number;
  name: string;
  email: string | null;
  affiliation: string | null;
}

export interface GuestPayload {
  name: string;
  email: string;
  affiliation: string;
}

/** Counselor or participant summoned when the session is scheduled. */
export interface SummonedDto {
  userId: number;
  name: string;
  role: RoleName;
}

export interface SessionDto {
  id: number;
  councilTypeId: number;
  councilType: string;
  councilKind: CouncilKind;
  facultyId: number;
  faculty: string;
  scheduledAt: string;
  location: string | null;
  status: SessionStatus;
  agendaClosed: boolean;
  actualStart: string | null;
  actualEnd: string | null;
  items: AgendaItemDto[];
  guests: GuestDto[];
  summoned: SummonedDto[];
}

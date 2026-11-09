import { RoleName } from '@core/auth/auth.models';
import { DecisionOutcome, SessionStatus } from '@modules/requests';

export interface QuorumDto {
  members: number;
  present: number;
  required: number;
  percentage: number;
  reached: boolean;
  /** False only when the council kind does not deliberate. A virtual council does. */
  applicable: boolean;
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

export interface DecisionPayload {
  outcome: DecisionOutcome;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  changeReason?: string;
}

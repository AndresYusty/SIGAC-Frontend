import { RoleName } from '@core/auth/auth.models';
import { DecisionResult, SessionStatus } from '@modules/requests';

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

export interface DecisionPayload {
  result: DecisionResult;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  changeReason?: string;
}

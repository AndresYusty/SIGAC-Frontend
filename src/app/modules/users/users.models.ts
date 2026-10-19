import { RoleName } from '@core/auth/auth.models';

export interface NodeDto {
  id: number;
  name: string;
  parentId: number | null;
  city: string | null;
}

export const COUNCIL_KINDS = ['ORDINARY', 'EXTRAORDINARY', 'VIRTUAL', 'EXPANDED'] as const;

export type CouncilKind = (typeof COUNCIL_KINDS)[number];

export interface CouncilTypeDto {
  id: number;
  code: string;
  name: string;
  kind: CouncilKind;
}

export interface ParameterDto {
  key: string;
  value: string;
  description: string;
}

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

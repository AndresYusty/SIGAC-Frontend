import { RoleName } from '@core/auth/auth.models';

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

export const ROLES = [
  'ROLE_ADMIN',
  'ROLE_COUNCIL_SECRETARY',
  'ROLE_FACULTY_SECRETARY',
  'ROLE_PRESIDENT',
  'ROLE_COUNCIL_MEMBER',
] as const;

export type RoleName = (typeof ROLES)[number];

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

export const MINUTES_STATUSES = ['DRAFT', 'EDITING', 'PENDING_SIGNATURE', 'PUBLISHED'] as const;

export type MinutesStatus = (typeof MINUTES_STATUSES)[number];

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

/** Badge tone per status/role value; display text lives in the `enums` translation keys. */
export const TONE: Record<string, string> = {
  FILED: 'info',
  RETURNED: 'warn',
  REJECTED: 'danger',
  APPROVED: 'ok',
  ON_AGENDA: 'info',
  PROCESSED: 'muted',
  SCHEDULED: 'info',
  CONVENED: 'warn',
  STARTED: 'ok',
  SUSPENDED: 'warn',
  FINISHED: 'muted',
  DRAFT: 'muted',
  EDITING: 'info',
  PENDING_SIGNATURE: 'warn',
  PUBLISHED: 'ok',
  DENIED: 'danger',
  POSTPONED: 'warn',
  CANCELLED: 'muted',
  ROLE_ADMIN: 'danger',
  ROLE_DEV: 'info',
  ROLE_SECRETARY_1: 'ok',
  ROLE_SECRETARY_2: 'info',
  ROLE_PRESIDENT: 'warn',
  ROLE_COUNCILOR: 'muted',
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

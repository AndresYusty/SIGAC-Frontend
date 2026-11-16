export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Request supports accepted by the backend (RN-08). */
export const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

/** Value for <input type="file" accept>: extensions plus MIME types for mobile pickers. */
export const DOCUMENT_ACCEPT = [
  ...DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`),
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',');

export function isAllowedDocument(name: string | null | undefined): boolean {
  const ext = /\.([^.]+)$/.exec(name ?? '')?.[1]?.toLowerCase();
  return !!ext && DOCUMENT_EXTENSIONS.includes(ext);
}

export function blobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback;
  }
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    return decodeURIComponent(encoded[1]);
  }
  const match = /filename="?([^";]+)/i.exec(header);
  return match ? match[1] : fallback;
}

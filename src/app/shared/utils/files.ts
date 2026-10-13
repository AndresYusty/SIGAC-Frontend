export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function blobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback;
  }
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(header);
  return match ? decodeURIComponent(match[1].replace(/"/g, '')) : fallback;
}

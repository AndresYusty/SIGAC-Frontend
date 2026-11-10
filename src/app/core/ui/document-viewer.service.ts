import { Injectable, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, Subscription, isObservable } from 'rxjs';
import { saveBlob } from '@shared/utils/files';
import { ToastService } from './toast.service';

/** Opens a document already loaded by the application, with a download of that same file. */
@Injectable({ providedIn: 'root' })
export class DocumentViewerService {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);

  readonly open = signal(false);
  readonly title = signal('');
  readonly loading = signal(false);
  readonly frame = signal<SafeResourceUrl | null>(null);
  readonly imageUrl = signal<string | null>(null);

  private blob: Blob | null = null;
  private raw: string | null = null;
  private filename = 'documento';
  private sub?: Subscription;

  show(source: Observable<Blob> | Blob, filename: string): void {
    this.sub?.unsubscribe();
    this.release();
    this.filename = filename?.trim() || 'documento';
    this.title.set(this.filename);
    this.loading.set(true);
    this.open.set(true);
    if (!isObservable(source)) {
      this.present(source);
      return;
    }
    this.sub = source.subscribe({
      next: (blob) => this.present(blob),
      error: (e) => {
        this.close();
        this.toast.apiError(e);
      },
    });
  }

  download(): void {
    if (this.blob) saveBlob(this.blob, this.filename);
  }

  close(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.release();
    this.open.set(false);
    this.loading.set(false);
  }

  private present(blob: Blob): void {
    this.blob = blob;
    this.raw = URL.createObjectURL(blob);
    const image = blob.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(this.filename);
    if (image) {
      this.imageUrl.set(this.raw);
      this.frame.set(null);
    } else {
      this.frame.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.raw));
      this.imageUrl.set(null);
    }
    this.loading.set(false);
  }

  private release(): void {
    if (this.raw) URL.revokeObjectURL(this.raw);
    this.raw = null;
    this.blob = null;
    this.frame.set(null);
    this.imageUrl.set(null);
  }
}

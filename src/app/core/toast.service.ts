import { Injectable, computed, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'ok' | 'error' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly itemsSig = signal<Toast[]>([]);
  private seq = 0;
  readonly items = computed(() => this.itemsSig());

  ok(text: string): void {
    this.push('ok', text);
  }

  error(text: string): void {
    this.push('error', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.itemsSig.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], text: string): void {
    const id = ++this.seq;
    this.itemsSig.update((list) => [...list, { id, kind, text }]);
    window.setTimeout(() => this.dismiss(id), 5200);
  }
}

import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly open = signal(false);
  readonly title = signal('');
  readonly message = signal('');
  readonly okLabel = signal('Confirmar');
  private resolver: ((value: boolean) => void) | null = null;

  ask(title: string, message: string, okLabel = 'Confirmar'): Promise<boolean> {
    this.title.set(title);
    this.message.set(message);
    this.okLabel.set(okLabel);
    this.open.set(true);
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  close(value: boolean): void {
    this.open.set(false);
    this.resolver?.(value);
    this.resolver = null;
  }
}

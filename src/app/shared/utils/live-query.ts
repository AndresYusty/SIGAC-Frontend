/** Keeps the latest filter request and waits briefly while the user is still typing. */
export class LiveQuery {
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;

  immediate(run: () => void): void {
    clearTimeout(this.timer);
    run();
  }

  typed(run: () => void, wait = 280): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(run, wait);
  }

  begin(): number {
    clearTimeout(this.timer);
    return ++this.generation;
  }

  isCurrent(id: number): boolean {
    return id === this.generation;
  }

  cancel(): void {
    clearTimeout(this.timer);
  }
}

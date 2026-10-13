import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { NodeDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { TranslatePipe } from '../../core/translate.pipe';

interface Step {
  id: 'university' | 'campus' | 'faculty' | 'program';
  /** Translation key prefix: `hierarchy.steps.<id>`. */
  key: string;
}

@Component({
  selector: 'app-hierarchy',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './hierarchy.html',
  styleUrl: './hierarchy.scss',
})
export class HierarchyPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly steps: Step[] = (['university', 'campus', 'faculty', 'program'] as const).map((id) => ({
    id,
    key: `hierarchy.steps.${id}`,
  }));

  readonly step = signal(0);
  readonly lists = [signal<NodeDto[]>([]), signal<NodeDto[]>([]), signal<NodeDto[]>([]), signal<NodeDto[]>([])];
  readonly selection = [signal<NodeDto | null>(null), signal<NodeDto | null>(null), signal<NodeDto | null>(null)];
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly filter = signal('');

  name = '';
  city = '';

  readonly current = computed(() => this.steps[this.step()]);
  readonly items = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const list = this.lists[this.step()]();
    return q ? list.filter((n) => `${n.name} ${n.city ?? ''}`.toLowerCase().includes(q)) : list;
  });
  readonly selected = computed(() => (this.step() < 3 ? this.selection[this.step()]() : null));
  readonly reachable = computed(() => {
    let i = 0;
    while (i < 3 && this.selection[i]()) i++;
    return i;
  });

  ngOnInit(): void {
    this.load(0);
  }

  load(level: number, selectId?: number): void {
    const parent = level > 0 ? this.selection[level - 1]()?.id : undefined;
    const sources: Array<() => Observable<NodeDto[]>> = [
      () => this.api.listUniversities(),
      () => this.api.listCampuses(parent!),
      () => this.api.listFaculties(parent!),
      () => this.api.listPrograms(parent!),
    ];
    this.loading.set(true);
    sources[level]().subscribe({
      next: (list) => {
        this.lists[level].set(list);
        this.loading.set(false);
        if (level < 3 && selectId) {
          const created = list.find((n) => n.id === selectId);
          if (created) this.select(created);
        }
        if (level === 0 && !this.selection[0]() && list.length === 1) this.select(list[0]);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.apiError(e);
      },
    });
  }

  select(node: NodeDto): void {
    const level = this.step();
    if (this.selection[level]()?.id === node.id) return;
    this.selection[level].set(node);
    for (let i = level + 1; i < 3; i++) this.selection[i].set(null);
    for (let i = level + 1; i < 4; i++) this.lists[i].set([]);
  }

  goTo(level: number): void {
    if (level > this.reachable() || level === this.step()) return;
    this.step.set(level);
    this.filter.set('');
    this.closeForm();
    if (level > 0 && this.lists[level]().length === 0) this.load(level);
  }

  next(): void {
    this.goTo(this.step() + 1);
  }

  previous(): void {
    this.goTo(this.step() - 1);
  }

  openForm(): void {
    this.name = '';
    this.city = '';
    this.creating.set(true);
  }

  closeForm(): void {
    this.creating.set(false);
  }

  save(): void {
    const level = this.step();
    const name = this.name.trim();
    const city = this.city.trim();
    if (!name || (level === 1 && !city)) return;
    const parent = level > 0 ? this.selection[level - 1]()!.id : 0;
    const requests: Array<() => Observable<NodeDto>> = [
      () => this.api.createUniversity(name),
      () => this.api.createCampus(name, city, parent),
      () => this.api.createFaculty(name, parent),
      () => this.api.createProgram(name, parent),
    ];
    this.saving.set(true);
    requests[level]().subscribe({
      next: (created) => {
        this.saving.set(false);
        this.creating.set(false);
        this.toast.ok('hierarchy.created', { name: created.name });
        this.load(level, created.id);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }

  restart(): void {
    for (const s of this.selection) s.set(null);
    for (let i = 1; i < 4; i++) this.lists[i].set([]);
    this.step.set(0);
    this.filter.set('');
    this.closeForm();
  }
}

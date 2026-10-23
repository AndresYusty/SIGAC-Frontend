import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UsersApi } from '../../users.api';
import { NodeDto } from '../../users.models';

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
  private readonly api = inject(UsersApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

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
  readonly editingId = signal<number | null>(null);

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

  load(level: number, selectId?: number, quiet = false): void {
    const parent = level > 0 ? this.selection[level - 1]()?.id : undefined;
    if (level > 0 && parent == null) {
      this.lists[level].set([]);
      return;
    }
    const sources: Array<() => Observable<NodeDto[]>> = [
      () => this.api.listUniversities(),
      () => this.api.listCampuses(parent!),
      () => this.api.listFaculties(parent!),
      () => this.api.listPrograms(parent!),
    ];
    if (!quiet) this.loading.set(true);
    sources[level]().subscribe({
      next: (list) => {
        this.lists[level].set(list);
        if (!quiet) this.loading.set(false);
        if (level < 3) {
          const current = this.selection[level]();
          if (current) {
            this.selection[level].set(list.find((n) => n.id === current.id) ?? null);
          }
          if (selectId) {
            const created = list.find((n) => n.id === selectId);
            if (created) this.select(created);
          } else if (level === 0 && !this.selection[0]() && list.length === 1) {
            this.select(list[0]);
          }
        }
      },
      error: (e) => {
        if (!quiet) this.loading.set(false);
        this.toast.apiError(e);
      },
    });
  }

  select(node: NodeDto): void {
    const level = this.step();
    const same = this.selection[level]()?.id === node.id;
    this.selection[level].set(node);
    if (!same) {
      for (let i = level + 1; i < 3; i++) this.selection[i].set(null);
      for (let i = level + 1; i < 4; i++) this.lists[i].set([]);
    }
    if (level < 3) this.load(level + 1, undefined, true);
  }

  goTo(level: number): void {
    if (level > this.reachable() || level === this.step()) return;
    this.step.set(level);
    this.filter.set('');
    this.closeForm();
    this.load(level);
  }

  next(): void {
    this.goTo(this.step() + 1);
  }

  previous(): void {
    this.goTo(this.step() - 1);
  }

  openForm(): void {
    this.editingId.set(null);
    this.name = '';
    this.city = '';
    this.creating.set(true);
  }

  openEdit(node: NodeDto): void {
    this.editingId.set(node.id);
    this.name = node.name;
    this.city = node.city ?? '';
    this.creating.set(true);
  }

  closeForm(): void {
    this.creating.set(false);
    this.editingId.set(null);
  }

  save(): void {
    const level = this.step();
    const name = this.name.trim();
    const city = this.city.trim();
    if (!name || (level === 1 && !city)) return;
    const parent = level > 0 ? this.selection[level - 1]()!.id : 0;
    const id = this.editingId();
    const requests: Array<() => Observable<NodeDto>> = id
      ? [
          () => this.api.updateUniversity(id, name),
          () => this.api.updateCampus(id, name, city, parent),
          () => this.api.updateFaculty(id, name, parent),
          () => this.api.updateProgram(id, name, parent),
        ]
      : [
          () => this.api.createUniversity(name),
          () => this.api.createCampus(name, city, parent),
          () => this.api.createFaculty(name, parent),
          () => this.api.createProgram(name, parent),
        ];
    this.saving.set(true);
    requests[level]().subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.creating.set(false);
        this.editingId.set(null);
        this.toast.ok(id ? 'hierarchy.updated' : 'hierarchy.created', { name: saved.name });
        this.load(level, saved.id);
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.apiError(e);
      },
    });
  }

  async remove(node: NodeDto): Promise<void> {
    const level = this.step();
    if (!(await this.confirm.ask('hierarchy.deleteTitle', 'hierarchy.deleteMessage', 'hierarchy.remove', { name: node.name }))) {
      return;
    }
    const calls = [
      () => this.api.deleteUniversity(node.id),
      () => this.api.deleteCampus(node.id),
      () => this.api.deleteFaculty(node.id),
      () => this.api.deleteProgram(node.id),
    ];
    calls[level]().subscribe({
      next: () => {
        if (level < 3 && this.selection[level]()?.id === node.id) {
          this.selection[level].set(null);
          for (let i = level + 1; i < 3; i++) this.selection[i].set(null);
          for (let i = level + 1; i < 4; i++) this.lists[i].set([]);
        }
        this.toast.ok('hierarchy.deleted', { name: node.name });
        this.load(level);
      },
      error: (e) => this.toast.apiError(e),
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

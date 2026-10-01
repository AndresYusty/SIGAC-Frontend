import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { saveBlob } from '../../core/files';
import { apiMessage } from '../../core/http-utils';
import { PlantillaDto, TipoConsejoDto, VariableDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-plantillas',
  imports: [FormsModule],
  templateUrl: './plantillas.html',
})
export class PlantillasPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly tipos = signal<TipoConsejoDto[]>([]);
  readonly list = signal<PlantillaDto[]>([]);
  readonly vars = signal<VariableDto[]>([]);
  readonly errores = signal<string[]>([]);
  tipoConsejoId: number | null = null;
  facultadId: number | null = null;
  nombre = 'Plantilla SIGAC';
  comentario = '';
  contenido = '';
  selected?: number;

  ngOnInit(): void {
    this.api.tiposConsejo().subscribe({
      next: (t) => {
        this.tipos.set(t);
        this.tipoConsejoId = t[0]?.id ?? null;
        this.load();
      },
    });
    this.api.variablesPlantilla().subscribe({ next: (v) => this.vars.set(v) });
  }

  load(): void {
    this.api.plantillas(this.tipoConsejoId ?? undefined).subscribe({
      next: (l) => this.list.set(l),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  abrir(p: PlantillaDto): void {
    this.api.plantilla(p.id).subscribe({
      next: (d) => {
        this.selected = d.id;
        this.nombre = d.nombre;
        this.comentario = d.comentario ?? '';
        this.contenido = d.contenido ?? '';
        this.tipoConsejoId = d.tipoConsejoId;
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  validar(): void {
    this.api.validarPlantilla(this.contenido).subscribe({
      next: (err) => {
        this.errores.set(err);
        if (!err.length) this.toast.ok('Plantilla válida');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  guardar(): void {
    if (!this.tipoConsejoId) return;
    this.api
      .guardarPlantilla({
        tipoConsejoId: this.tipoConsejoId,
        facultadId: this.facultadId,
        nombre: this.nombre,
        contenido: this.contenido,
        comentario: this.comentario,
      })
      .subscribe({
        next: (p) => {
          this.toast.ok('Plantilla guardada (v' + p.version + ')');
          this.load();
          this.abrir(p);
        },
        error: (e) => this.toast.error(apiMessage(e)),
      });
  }

  activar(id: number): void {
    this.api.activarPlantilla(id).subscribe({
      next: () => {
        this.toast.ok('Plantilla activada');
        this.load();
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  preview(): void {
    this.api.previsualizarPlantilla(this.contenido).subscribe({
      next: (b) => saveBlob(b, 'previsualizacion.pdf'),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

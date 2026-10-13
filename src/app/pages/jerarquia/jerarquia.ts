import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { NodoDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

interface Paso {
  titulo: string;
  singular: string;
  descripcion: string;
}

@Component({
  selector: 'app-jerarquia',
  imports: [FormsModule],
  templateUrl: './jerarquia.html',
  styleUrl: './jerarquia.scss',
})
export class JerarquiaPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly pasos: Paso[] = [
    { titulo: 'Universidad', singular: 'universidad', descripcion: 'Seleccione la institución o registre una nueva.' },
    { titulo: 'Sede', singular: 'sede', descripcion: 'Seleccione la sede de la universidad donde se ubica la facultad.' },
    { titulo: 'Facultad', singular: 'facultad', descripcion: 'Seleccione la facultad a la que pertenecen los programas.' },
    { titulo: 'Programa', singular: 'programa', descripcion: 'Consulte y registre los programas académicos de la facultad.' },
  ];

  readonly paso = signal(0);
  readonly listas = [signal<NodoDto[]>([]), signal<NodoDto[]>([]), signal<NodoDto[]>([]), signal<NodoDto[]>([])];
  readonly seleccion = [signal<NodoDto | null>(null), signal<NodoDto | null>(null), signal<NodoDto | null>(null)];
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly creando = signal(false);
  readonly filtro = signal('');

  nombre = '';
  ciudad = '';

  readonly actual = computed(() => this.pasos[this.paso()]);
  readonly items = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    const lista = this.listas[this.paso()]();
    return q ? lista.filter((n) => `${n.nombre} ${n.ciudad ?? ''}`.toLowerCase().includes(q)) : lista;
  });
  readonly seleccionado = computed(() => (this.paso() < 3 ? this.seleccion[this.paso()]() : null));
  readonly alcanzable = computed(() => {
    let i = 0;
    while (i < 3 && this.seleccion[i]()) i++;
    return i;
  });

  ngOnInit(): void {
    this.cargar(0);
  }

  cargar(nivel: number, seleccionarId?: number): void {
    const padre = nivel > 0 ? this.seleccion[nivel - 1]()?.id : undefined;
    const fuentes: Array<() => Observable<NodoDto[]>> = [
      () => this.api.universidades(),
      () => this.api.sedes(padre!),
      () => this.api.facultades(padre!),
      () => this.api.programas(padre!),
    ];
    this.cargando.set(true);
    fuentes[nivel]().subscribe({
      next: (lista) => {
        this.listas[nivel].set(lista);
        this.cargando.set(false);
        if (nivel < 3 && seleccionarId) {
          const nuevo = lista.find((n) => n.id === seleccionarId);
          if (nuevo) this.seleccionar(nuevo);
        }
        if (nivel === 0 && !this.seleccion[0]() && lista.length === 1) this.seleccionar(lista[0]);
      },
      error: (e) => {
        this.cargando.set(false);
        this.toast.error(apiMessage(e));
      },
    });
  }

  seleccionar(nodo: NodoDto): void {
    const nivel = this.paso();
    if (this.seleccion[nivel]()?.id === nodo.id) return;
    this.seleccion[nivel].set(nodo);
    for (let i = nivel + 1; i < 3; i++) this.seleccion[i].set(null);
    for (let i = nivel + 1; i < 4; i++) this.listas[i].set([]);
  }

  irA(nivel: number): void {
    if (nivel > this.alcanzable() || nivel === this.paso()) return;
    this.paso.set(nivel);
    this.filtro.set('');
    this.cerrarFormulario();
    if (nivel > 0 && this.listas[nivel]().length === 0) this.cargar(nivel);
  }

  siguiente(): void {
    this.irA(this.paso() + 1);
  }

  anterior(): void {
    this.irA(this.paso() - 1);
  }

  abrirFormulario(): void {
    this.nombre = '';
    this.ciudad = '';
    this.creando.set(true);
  }

  cerrarFormulario(): void {
    this.creando.set(false);
  }

  guardar(): void {
    const nivel = this.paso();
    const nombre = this.nombre.trim();
    const ciudad = this.ciudad.trim();
    if (!nombre || (nivel === 1 && !ciudad)) return;
    const padre = nivel > 0 ? this.seleccion[nivel - 1]()!.id : 0;
    const peticiones: Array<() => Observable<NodoDto>> = [
      () => this.api.crearUniversidad(nombre),
      () => this.api.crearSede(nombre, ciudad, padre),
      () => this.api.crearFacultad(nombre, padre),
      () => this.api.crearPrograma(nombre, padre),
    ];
    this.guardando.set(true);
    peticiones[nivel]().subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.creando.set(false);
        this.toast.ok(`Se registró "${creado.nombre}" correctamente.`);
        this.cargar(nivel, creado.id);
      },
      error: (e) => {
        this.guardando.set(false);
        this.toast.error(apiMessage(e));
      },
    });
  }

  reiniciar(): void {
    for (const s of this.seleccion) s.set(null);
    for (let i = 1; i < 4; i++) this.listas[i].set([]);
    this.paso.set(0);
    this.filtro.set('');
    this.cerrarFormulario();
  }
}

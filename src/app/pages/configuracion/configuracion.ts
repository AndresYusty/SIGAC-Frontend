import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { apiMessage } from '../../core/http-utils';
import { ParametroDto, TipoConsejoDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-configuracion',
  imports: [FormsModule],
  templateUrl: './configuracion.html',
})
export class ConfiguracionPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly tipos = signal<TipoConsejoDto[]>([]);
  readonly params = signal<ParametroDto[]>([]);
  codigo = '';
  nombre = '';

  ngOnInit(): void {
    this.api.tiposConsejo().subscribe({ next: (t) => this.tipos.set(t) });
    this.api.parametros().subscribe({ next: (p) => this.params.set(p) });
  }

  crearTipo(): void {
    this.api.crearTipoConsejo(this.codigo, this.nombre).subscribe({
      next: (t) => {
        this.tipos.update((list) => [...list, t]);
        this.codigo = '';
        this.nombre = '';
        this.toast.ok('Tipo de consejo creado');
      },
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  guardarTipo(t: TipoConsejoDto): void {
    this.api.editarTipoConsejo(t.id, t.codigo, t.nombre).subscribe({
      next: () => this.toast.ok('Tipo actualizado'),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }

  guardarParam(p: ParametroDto): void {
    this.api.actualizarParametro(p.clave, p.valor).subscribe({
      next: () => this.toast.ok('Parámetro actualizado'),
      error: (e) => this.toast.error(apiMessage(e)),
    });
  }
}

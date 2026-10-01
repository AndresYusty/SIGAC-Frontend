import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  ActaDto,
  AsistenciaDto,
  AuditLogDto,
  DashboardDto,
  EstadoActa,
  EstadoSesion,
  EstadoSolicitud,
  HistorialDto,
  NodoDto,
  Page,
  ParametroDto,
  PlantillaDto,
  RepositorioActaDto,
  ResultadoDecision,
  SesionDto,
  SesionResumenDto,
  SolicitudDto,
  TipoConsejoDto,
  UsuarioDto,
  VariableDto,
  VerificacionDto,
} from './models';
import { toQuery } from './http-utils';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  dashboard() {
    return this.http.get<DashboardDto>(`${this.base}/dashboard`);
  }

  listUsers(q = '', page = 0, size = 20) {
    return this.http.get<Page<UsuarioDto>>(`${this.base}/users`, { params: toQuery({ q, page, size, sort: 'nombre' }) });
  }

  getUser(id: number) {
    return this.http.get<UsuarioDto>(`${this.base}/users/${id}`);
  }

  createUser(body: {
    nombre: string;
    email: string;
    password: string;
    roles: string[];
    facultadId: number | null;
    programaId: number | null;
  }) {
    return this.http.post<UsuarioDto>(`${this.base}/users`, body);
  }

  updateUser(
    id: number,
    body: { nombre: string; roles: string[]; facultadId: number | null; programaId: number | null },
  ) {
    return this.http.put<UsuarioDto>(`${this.base}/users/${id}`, body);
  }

  setUserActive(id: number, activo: boolean) {
    return this.http.patch<UsuarioDto>(`${this.base}/users/${id}/estado`, null, { params: { activo } });
  }

  universidades() {
    return this.http.get<NodoDto[]>(`${this.base}/jerarquia/universidades`);
  }
  crearUniversidad(nombre: string) {
    return this.http.post<NodoDto>(`${this.base}/jerarquia/universidades`, { nombre });
  }
  editarUniversidad(id: number, nombre: string) {
    return this.http.put<NodoDto>(`${this.base}/jerarquia/universidades/${id}`, { nombre });
  }
  sedes(universidadId: number) {
    return this.http.get<NodoDto[]>(`${this.base}/jerarquia/sedes`, { params: { universidadId } });
  }
  crearSede(nombre: string, ciudad: string, universidadId: number) {
    return this.http.post<NodoDto>(`${this.base}/jerarquia/sedes`, { nombre, ciudad, universidadId });
  }
  editarSede(id: number, nombre: string, ciudad: string, universidadId: number) {
    return this.http.put<NodoDto>(`${this.base}/jerarquia/sedes/${id}`, { nombre, ciudad, universidadId });
  }
  facultades(sedeId: number) {
    return this.http.get<NodoDto[]>(`${this.base}/jerarquia/facultades`, { params: { sedeId } });
  }
  crearFacultad(nombre: string, sedeId: number) {
    return this.http.post<NodoDto>(`${this.base}/jerarquia/facultades`, { nombre, sedeId });
  }
  editarFacultad(id: number, nombre: string, sedeId: number) {
    return this.http.put<NodoDto>(`${this.base}/jerarquia/facultades/${id}`, { nombre, sedeId });
  }
  programas(facultadId: number) {
    return this.http.get<NodoDto[]>(`${this.base}/jerarquia/programas`, { params: { facultadId } });
  }
  crearPrograma(nombre: string, facultadId: number) {
    return this.http.post<NodoDto>(`${this.base}/jerarquia/programas`, { nombre, facultadId });
  }
  editarPrograma(id: number, nombre: string, facultadId: number) {
    return this.http.put<NodoDto>(`${this.base}/jerarquia/programas/${id}`, { nombre, facultadId });
  }

  tiposConsejo() {
    return this.http.get<TipoConsejoDto[]>(`${this.base}/tipos-consejo`);
  }
  crearTipoConsejo(codigo: string, nombre: string) {
    return this.http.post<TipoConsejoDto>(`${this.base}/tipos-consejo`, { codigo, nombre });
  }
  editarTipoConsejo(id: number, codigo: string, nombre: string) {
    return this.http.put<TipoConsejoDto>(`${this.base}/tipos-consejo/${id}`, { codigo, nombre });
  }
  parametros() {
    return this.http.get<ParametroDto[]>(`${this.base}/parametros`);
  }
  actualizarParametro(clave: string, valor: string) {
    return this.http.put<ParametroDto>(`${this.base}/parametros/${clave}`, { valor });
  }

  plantillas(tipoConsejoId?: number) {
    return this.http.get<PlantillaDto[]>(`${this.base}/plantillas`, {
      params: toQuery({ tipoConsejoId }),
    });
  }
  plantilla(id: number) {
    return this.http.get<PlantillaDto>(`${this.base}/plantillas/${id}`);
  }
  variablesPlantilla() {
    return this.http.get<VariableDto[]>(`${this.base}/plantillas/variables`);
  }
  validarPlantilla(contenido: string) {
    return this.http.post<string[]>(`${this.base}/plantillas/validar`, { contenido });
  }
  guardarPlantilla(body: {
    tipoConsejoId: number;
    facultadId: number | null;
    nombre: string;
    contenido: string;
    comentario: string;
  }) {
    return this.http.post<PlantillaDto>(`${this.base}/plantillas`, body);
  }
  activarPlantilla(id: number) {
    return this.http.put<PlantillaDto>(`${this.base}/plantillas/${id}/activar`, {});
  }
  previsualizarPlantilla(contenido: string) {
    return this.http.post(`${this.base}/plantillas/previsualizar`, { contenido }, { responseType: 'blob' });
  }

  buscarSolicitudes(params: {
    estado?: EstadoSolicitud | '';
    codigo?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  }) {
    return this.http.get<Page<SolicitudDto>>(`${this.base}/requests`, {
      params: toQuery({ ...params, sort: 'fechaRadicacion,desc' }),
    });
  }
  solicitud(id: number) {
    return this.http.get<SolicitudDto>(`${this.base}/requests/${id}`);
  }
  historialSolicitud(id: number) {
    return this.http.get<HistorialDto[]>(`${this.base}/requests/${id}/historial`);
  }
  radicarSolicitud(fd: FormData) {
    return this.http.post<SolicitudDto>(`${this.base}/requests`, fd);
  }
  actualizarSolicitud(id: number, fd: FormData) {
    return this.http.put<SolicitudDto>(`${this.base}/requests/${id}`, fd);
  }
  aprobarSolicitud(id: number) {
    return this.http.post<SolicitudDto>(`${this.base}/requests/${id}/aprobar`, {});
  }
  rechazarSolicitud(id: number, motivo: string) {
    return this.http.post<SolicitudDto>(`${this.base}/requests/${id}/rechazar`, { motivo });
  }
  devolverSolicitud(id: number, motivo: string) {
    return this.http.post<SolicitudDto>(`${this.base}/requests/${id}/devolver`, { motivo });
  }
  descargarAnexo(id: number, anexoId: number) {
    return this.http.get(`${this.base}/requests/${id}/anexos/${anexoId}/descargar`, { responseType: 'blob' });
  }

  listarSesiones(estado?: EstadoSesion | '', page = 0, size = 20) {
    return this.http.get<Page<SesionResumenDto>>(`${this.base}/sesiones`, {
      params: toQuery({ estado, page, size, sort: 'fechaProgramada,desc' }),
    });
  }
  sesion(id: number) {
    return this.http.get<SesionDto>(`${this.base}/sesiones/${id}`);
  }
  crearSesion(tipoConsejoId: number, fechaProgramada: string, lugar: string) {
    return this.http.post<SesionDto>(`${this.base}/sesiones`, { tipoConsejoId, fechaProgramada, lugar });
  }
  agregarPunto(sesionId: number, solicitudId: number) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/puntos`, { solicitudId });
  }
  quitarPunto(sesionId: number, puntoId: number) {
    return this.http.delete<SesionDto>(`${this.base}/sesiones/${sesionId}/puntos/${puntoId}`);
  }
  reordenarPuntos(sesionId: number, puntoIds: number[]) {
    return this.http.put<SesionDto>(`${this.base}/sesiones/${sesionId}/puntos/orden`, { puntoIds });
  }
  cerrarAgenda(sesionId: number) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/cerrar-agenda`, {});
  }
  citacion(sesionId: number) {
    return this.http.get(`${this.base}/sesiones/${sesionId}/citacion`, { responseType: 'blob' });
  }
  asistencia(sesionId: number) {
    return this.http.get<AsistenciaDto>(`${this.base}/sesiones/${sesionId}/asistencia`);
  }
  registrarAsistencia(sesionId: number, items: { usuarioId: number; presente: boolean }[]) {
    return this.http.put<AsistenciaDto>(`${this.base}/sesiones/${sesionId}/asistencia`, { items });
  }
  iniciarSesion(sesionId: number) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/iniciar`, {});
  }
  suspenderSesion(sesionId: number) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/suspender`, {});
  }
  reanudarSesion(sesionId: number) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/reanudar`, {});
  }
  finalizarSesion(sesionId: number) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/finalizar`, {});
  }
  decision(
    sesionId: number,
    puntoId: number,
    body: {
      resultado: ResultadoDecision;
      votosFavor: number;
      votosContra: number;
      abstenciones: number;
      motivoModificacion?: string;
    },
  ) {
    return this.http.post(`${this.base}/sesiones/${sesionId}/puntos/${puntoId}/decision`, body);
  }
  nota(sesionId: number, puntoId: number, contenido: string) {
    return this.http.post(`${this.base}/sesiones/${sesionId}/puntos/${puntoId}/notas`, { contenido });
  }
  puntoVario(sesionId: number, titulo: string, descripcion: string) {
    return this.http.post<SesionDto>(`${this.base}/sesiones/${sesionId}/puntos-varios`, { titulo, descripcion });
  }

  listarActas(estado?: EstadoActa | '', page = 0, size = 20) {
    return this.http.get<Page<ActaDto>>(`${this.base}/actas`, {
      params: toQuery({ estado, page, size, sort: 'creadoEn,desc' }),
    });
  }
  acta(id: number) {
    return this.http.get<ActaDto>(`${this.base}/actas/${id}`);
  }
  generarActa(sesionId: number) {
    return this.http.post<ActaDto>(`${this.base}/actas/sesion/${sesionId}`, {});
  }
  editarActa(id: number, contenidoHtml: string) {
    return this.http.put<ActaDto>(`${this.base}/actas/${id}/contenido`, { contenidoHtml });
  }
  vistaPreviaActa(id: number) {
    return this.http.get(`${this.base}/actas/${id}/vista-previa`, { responseType: 'blob' });
  }
  enviarAFirma(id: number) {
    return this.http.post<ActaDto>(`${this.base}/actas/${id}/enviar-a-firma`, {});
  }
  rechazarActa(id: number, observacion: string) {
    return this.http.post<ActaDto>(`${this.base}/actas/${id}/rechazar`, { observacion });
  }
  firmarActa(id: number) {
    return this.http.post<ActaDto>(`${this.base}/actas/${id}/aprobar-y-firmar`, {});
  }

  repositorio(params: {
    consecutivo?: string;
    tipoConsejoId?: number | '';
    desde?: string;
    hasta?: string;
    sedeId?: number | '';
    facultadId?: number | '';
    texto?: string;
    page?: number;
    size?: number;
  }) {
    return this.http.get<Page<RepositorioActaDto>>(`${this.base}/repositorio/actas`, {
      params: toQuery({ ...params, sort: 'fechaSesion,desc' }),
    });
  }
  verificarActa(id: number) {
    return this.http.get<VerificacionDto>(`${this.base}/repositorio/actas/${id}/verificar`);
  }
  visorActa(id: number) {
    return this.http.get(`${this.base}/repositorio/actas/${id}/visor`, { responseType: 'blob' });
  }
  descargarActa(id: number) {
    return this.http.get(`${this.base}/repositorio/actas/${id}/descargar`, { responseType: 'blob' });
  }

  auditoria(params: { evento?: string; usuario?: string; page?: number; size?: number }) {
    return this.http.get<Page<AuditLogDto>>(`${this.base}/auditoria`, { params: toQuery(params) });
  }
}

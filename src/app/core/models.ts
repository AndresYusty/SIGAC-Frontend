export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  detalles: string[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface UsuarioDto {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  roles: string[];
  facultadId: number | null;
  facultadNombre: string | null;
  programaId: number | null;
  programaNombre: string | null;
  ultimoAcceso: string | null;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEn: string;
  usuario: UsuarioDto;
}

export interface MensajeResponse {
  mensaje: string;
}

export interface SessionState {
  token: string;
  tipo: string;
  expiraEn: string;
  usuario: UsuarioDto;
}

export interface NodoDto {
  id: number;
  nombre: string;
  padreId: number | null;
  ciudad: string | null;
}

export interface TipoConsejoDto {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ParametroDto {
  clave: string;
  valor: string;
  descripcion: string;
}

export interface VariableDto {
  nombre: string;
  tipo: string;
  descripcion: string;
  ejemplo: string;
}

export interface PlantillaDto {
  id: number;
  nombre: string;
  tipoConsejoId: number;
  tipoConsejoNombre: string;
  facultadId: number | null;
  facultadNombre: string | null;
  version: number;
  activa: boolean;
  comentario: string | null;
  creadoPor: string;
  creadoEn: string;
  contenido: string | null;
}

export type TipoSolicitud = 'ACADEMICA' | 'ADMINISTRATIVA' | 'ESTUDIANTIL' | 'DOCENTE';
export type EstadoSolicitud = 'RADICADO' | 'DEVUELTO' | 'RECHAZADO' | 'APROBADO' | 'EN_AGENDA' | 'PROCESADO';
export type EstadoSesion = 'PROGRAMADA' | 'CONVOCADA' | 'INICIADA' | 'SUSPENDIDA' | 'FINALIZADA';
export type EstadoActa = 'BORRADOR' | 'EN_EDICION' | 'PENDIENTE_DE_FIRMA' | 'PUBLICADA';
export type ResultadoDecision = 'APROBADO' | 'NEGADO' | 'APLAZADO' | 'CANCELADO';

export interface AnexoDto {
  id: number;
  nombre: string;
  tamanoBytes: number;
  hashSha256: string;
}

export interface SolicitudDto {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  solicitante: string;
  tipoSolicitud: TipoSolicitud;
  estado: EstadoSolicitud;
  facultadId: number;
  facultad: string;
  programaId: number | null;
  programa: string | null;
  radicador: string;
  fechaRadicacion: string;
  anexos: AnexoDto[];
}

export interface HistorialDto {
  estadoAnterior: EstadoSolicitud | null;
  estadoNuevo: EstadoSolicitud;
  motivo: string | null;
  usuario: string;
  fecha: string;
}

export interface SesionResumenDto {
  id: number;
  tipoConsejo: string;
  facultad: string;
  fechaProgramada: string;
  lugar: string;
  estado: EstadoSesion;
  agendaCerrada: boolean;
  totalPuntos: number;
}

export interface PuntoDto {
  id: number;
  orden: number;
  titulo: string;
  descripcion: string | null;
  solicitudCodigo: string | null;
  esVarios: boolean;
  resultado: ResultadoDecision | null;
  votosFavor: number;
  votosContra: number;
  abstenciones: number;
  decididoPor: string | null;
  notasDebate: string | null;
}

export interface SesionDto {
  id: number;
  tipoConsejoId: number;
  tipoConsejo: string;
  facultadId: number;
  facultad: string;
  fechaProgramada: string;
  lugar: string;
  estado: EstadoSesion;
  agendaCerrada: boolean;
  inicioReal: string | null;
  finReal: string | null;
  puntos: PuntoDto[];
}

export interface QuorumDto {
  integrantes: number;
  presentes: number;
  requeridos: number;
  porcentaje: number;
  alcanzado: boolean;
}

export interface AsistenteDto {
  usuarioId: number;
  nombre: string;
  rol: string;
  presente: boolean;
}

export interface AsistenciaDto {
  estadoSesion: EstadoSesion;
  quorum: QuorumDto;
  asistentes: AsistenteDto[];
}

export interface ActaDto {
  id: number;
  consecutivo: string;
  estado: EstadoActa;
  sesionId: number;
  tipoConsejo: string;
  facultad: string;
  fechaSesion: string;
  observacionRechazo: string | null;
  firmadoPor: string | null;
  firmadoEn: string | null;
  contenidoHtml: string | null;
}

export interface RepositorioActaDto {
  id: number;
  consecutivo: string;
  tipoConsejo: string;
  universidad: string;
  sede: string;
  facultad: string;
  fechaSesion: string;
  firmadoPor: string;
  firmadoEn: string;
  hashSha256: string;
}

export interface VerificacionDto {
  consecutivo: string;
  hashAlmacenado: string;
  hashCalculado: string;
  integro: boolean;
}

export interface AuditLogDto {
  id: number;
  evento: string;
  usuarioEmail: string;
  ip: string;
  entidad: string;
  entidadId: string;
  detalle: string | null;
  fecha: string;
}

export interface DashboardDto {
  usuario: string;
  indicadores: Record<string, unknown>;
}

export interface ActaPublicadaResumen {
  id: number;
  consecutivo: string;
  fechaSesion: string;
}

export const ROLES = [
  'ROLE_ADMIN',
  'ROLE_DEV',
  'ROLE_SECRETARIA_1',
  'ROLE_SECRETARIA_2',
  'ROLE_PRESIDENTE',
  'ROLE_CONSEJERO',
] as const;

export type RolNombre = (typeof ROLES)[number];

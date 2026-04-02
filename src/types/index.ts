export interface Horario {
  id: string;
  nombre: string;
  tipo: 'BLOQUEADO' | 'PERMITIDO';
  horaInicio: string;
  horaFin: string;
  dias: DiaSemana[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

export interface AppBloqueada {
  id: string;
  nombre: string;
  rutaEjecutable: string;
  icono: string | null;
  hashSha256: string | null;
  categoria: 'STEAM' | 'EPIC' | 'GOG' | 'MANUAL' | 'DETECTADO';
  ultimaEjecucion: string | null;
  vecesEjecutado: number;
  bloqueado: boolean;
  creadoEn: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  app_nombre: string;
  modo: ModoBloqueo;
}

export type ModoBloqueo = 'SOFT' | 'MEDIUM' | 'STRICT';

export interface EventoHistorial {
  id: string;
  app_id: string;
  app_nombre: string;
  tipo_evento: 'BLOQUEO' | 'APERTURA_PERMITIDA' | 'INTENTO_BLOQUEO';
  timestamp: string;
  modo_bloqueo: ModoBloqueo;
  duracion_proceso_ms: number;
  detalles: Record<string, unknown>;
}

export interface EstadoProteccion {
  activa: boolean;
  modo_bloqueo: ModoBloqueo;
  desde: string | null;
  hasta: string | null;
  focus_extremo: boolean;
}

export interface Estadisticas {
  bloqueos_hoy: number;
  bloqueos_semana: number;
  racha_dias: number;
  app_mas_tentacion: { id: string; nombre: string; cantidad: number } | null;
}

export interface ProcessInfo {
  pid: number;
  nombre: string;
  ruta: string;
}

export interface NuevoHorario {
  nombre: string;
  tipo: 'BLOQUEADO' | 'PERMITIDO';
  horaInicio: string;
  horaFin: string;
  dias: DiaSemana[];
}

export interface NuevaApp {
  nombre: string;
  rutaEjecutable: string;
  categoria: AppBloqueada['categoria'];
}

export interface GrupoHorario {
  id: string;
  nombre: string;
  horariosIds: string[];
  appsIds: string[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NuevoGrupoHorario {
  nombre: string;
  horariosIds: string[];
  appsIds: string[];
}

export interface AppConHorarios {
  app: AppBloqueada;
  grupos: GrupoHorario[];
}

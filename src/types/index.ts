export interface Horario {
  id: string;
  nombre: string;
  tipo: 'BLOQUEADO' | 'PERMITIDO';
  hora_inicio: string;
  hora_fin: string;
  dias: DiaSemana[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

export interface AppBloqueada {
  id: string;
  nombre: string;
  ruta_ejecutable: string;
  icono: string | null;
  categoria: 'STEAM' | 'EPIC' | 'GOG' | 'MANUAL' | 'DETECTADO';
  ultima_ejecucion: string | null;
  veces_ejecutado: number;
  bloqueado: boolean;
  creado_en: string;
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
  hora_inicio: string;
  hora_fin: string;
  dias: DiaSemana[];
}

export interface NuevaApp {
  nombre: string;
  ruta_ejecutable: string;
  categoria: AppBloqueada['categoria'];
}

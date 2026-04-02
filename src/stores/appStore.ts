import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Horario, AppBloqueada, ModoBloqueo, EstadoProteccion, Estadisticas, EventoHistorial, ProcessInfo, NuevaApp, NuevoHorario, GrupoHorario, NuevoGrupoHorario, AppConHorarios } from '../types';

interface AppState {
  horarios: Horario[];
  gruposHorarios: GrupoHorario[];
  appsBloqueadas: AppBloqueada[];
  appsConHorarios: AppConHorarios[];
  estadoProteccion: EstadoProteccion;
  estadisticas: Estadisticas;
  historialReciente: EventoHistorial[];
  procesoActual: ProcessInfo | null;
  sidebarCollapsed: boolean;
  paginaActual: 'dashboard' | 'horarios' | 'apps' | 'historial' | 'settings';
  
  // Actions
  cargarHorarios: () => Promise<void>;
  crearHorario: (horario: NuevoHorario) => Promise<void>;
  actualizarHorario: (id: string, horario: Partial<Horario>) => Promise<void>;
  eliminarHorario: (id: string) => Promise<void>;
  toggleHorario: (id: string) => Promise<void>;
  
  cargarGruposHorarios: () => Promise<void>;
  crearGrupoHorario: (grupo: NuevoGrupoHorario) => Promise<void>;
  actualizarGrupoHorario: (id: string, grupo: Partial<GrupoHorario>) => Promise<void>;
  eliminarGrupoHorario: (id: string) => Promise<void>;
  toggleGrupoHorario: (id: string) => Promise<void>;
  assignAppToGrupo: (appId: string, grupoId: string) => Promise<void>;
  removeAppFromGrupo: (appId: string, grupoId: string) => Promise<void>;
  
  cargarApps: () => Promise<void>;
  cargarAppsConHorarios: () => Promise<void>;
  agregarApp: (app: NuevaApp) => Promise<void>;
  eliminarApp: (id: string) => Promise<void>;
  toggleApp: (id: string) => Promise<void>;
  detectarSteamGames: () => Promise<AppBloqueada[]>;
  getRunningProcesses: () => Promise<ProcessInfo[]>;
  
  cargarEstadoProteccion: () => Promise<void>;
  toggleProteccion: (password: string) => Promise<boolean>;
  setModoBloqueo: (modo: ModoBloqueo) => Promise<void>;
  pauseProteccion: (minutes: number, password: string) => Promise<boolean>;
  
  cargarEstadisticas: () => Promise<void>;
  cargarHistorial: (limite?: number) => Promise<void>;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPaginaActual: (pagina: AppState['paginaActual']) => void;
  setProcesoActual: (proceso: ProcessInfo | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  horarios: [],
  gruposHorarios: [],
  appsBloqueadas: [],
  appsConHorarios: [],
  estadoProteccion: { activa: false, modo_bloqueo: 'MEDIUM', desde: null, hasta: null, focus_extremo: false },
  estadisticas: { bloqueos_hoy: 0, bloqueos_semana: 0, racha_dias: 0, app_mas_tentacion: null },
  historialReciente: [],
  procesoActual: null,
  sidebarCollapsed: false,
  paginaActual: 'dashboard',

  cargarHorarios: async () => {
    try {
      const horarios = await invoke<Horario[]>('get_horarios');
      set({ horarios });
    } catch (e) {
      console.error('Error cargando horarios:', e);
    }
  },

  crearHorario: async (horario) => {
    try {
      await invoke('create_horario', { horario });
      await get().cargarHorarios();
    } catch (e) {
      console.error('Error creando horario:', e);
      throw e;
    }
  },

  actualizarHorario: async (id, horario) => {
    try {
      await invoke('update_horario', { id, horario });
      await get().cargarHorarios();
    } catch (e) {
      console.error('Error actualizando horario:', e);
      throw e;
    }
  },

  eliminarHorario: async (id) => {
    try {
      await invoke('delete_horario', { id });
      await get().cargarHorarios();
    } catch (e) {
      console.error('Error eliminando horario:', e);
      throw e;
    }
  },

  toggleHorario: async (id) => {
    try {
      await invoke('toggle_horario', { id });
      await get().cargarHorarios();
    } catch (e) {
      console.error('Error toggling horario:', e);
    }
  },

  cargarGruposHorarios: async () => {
    try {
      const gruposHorarios = await invoke<GrupoHorario[]>('get_grupos_horarios');
      set({ gruposHorarios });
    } catch (e) {
      console.error('Error cargando grupos de horarios:', e);
    }
  },

  crearGrupoHorario: async (grupo) => {
    try {
      await invoke('create_grupo_horario', { grupo });
      await get().cargarGruposHorarios();
    } catch (e) {
      console.error('Error creando grupo de horarios:', e);
      throw e;
    }
  },

  actualizarGrupoHorario: async (id, grupo) => {
    try {
      await invoke('update_grupo_horario', { id, grupo });
      await get().cargarGruposHorarios();
    } catch (e) {
      console.error('Error actualizando grupo de horarios:', e);
      throw e;
    }
  },

  eliminarGrupoHorario: async (id) => {
    try {
      await invoke('delete_grupo_horario', { id });
      await get().cargarGruposHorarios();
    } catch (e) {
      console.error('Error eliminando grupo de horarios:', e);
      throw e;
    }
  },

  toggleGrupoHorario: async (id) => {
    try {
      await invoke('toggle_grupo_horario', { id });
      await get().cargarGruposHorarios();
    } catch (e) {
      console.error('Error toggling grupo de horarios:', e);
    }
  },

  assignAppToGrupo: async (appId, grupoId) => {
    try {
      await invoke('assign_app_to_grupo', { appId, grupoId });
      await get().cargarGruposHorarios();
    } catch (e) {
      console.error('Error asignando app a grupo:', e);
      throw e;
    }
  },

  removeAppFromGrupo: async (appId, grupoId) => {
    try {
      await invoke('remove_app_from_grupo', { appId, grupoId });
      await get().cargarGruposHorarios();
    } catch (e) {
      console.error('Error removiendo app de grupo:', e);
      throw e;
    }
  },

  cargarAppsConHorarios: async () => {
    try {
      const appsConHorarios = await invoke<AppConHorarios[]>('get_apps_with_grupos');
      set({ appsConHorarios });
    } catch (e) {
      console.error('Error cargando apps con grupos:', e);
    }
  },

  cargarApps: async () => {
    try {
      const appsBloqueadas = await invoke<AppBloqueada[]>('get_apps_bloqueadas');
      set({ appsBloqueadas });
    } catch (e) {
      console.error('Error cargando apps:', e);
    }
  },

  agregarApp: async (app) => {
    try {
      await invoke('add_app_bloqueada', { app });
      await get().cargarApps();
    } catch (e) {
      console.error('Error agregando app:', e);
      throw e;
    }
  },

  eliminarApp: async (id) => {
    try {
      await invoke('remove_app_bloqueada', { id });
      await get().cargarApps();
    } catch (e) {
      console.error('Error eliminando app:', e);
      throw e;
    }
  },

  toggleApp: async (id) => {
    try {
      await invoke('toggle_app_bloqueada', { id });
      await get().cargarApps();
    } catch (e) {
      console.error('Error toggling app:', e);
      throw e;
    }
  },

  detectarSteamGames: async () => {
    try {
      return await invoke<AppBloqueada[]>('detect_steam_games');
    } catch (e) {
      console.error('Error detectando juegos de Steam:', e);
      return [];
    }
  },

  getRunningProcesses: async () => {
    try {
      return await invoke<ProcessInfo[]>('get_running_processes');
    } catch (e) {
      console.error('Error get processes:', e);
      return [];
    }
  },

  cargarEstadoProteccion: async () => {
    try {
      const estadoProteccion = await invoke<EstadoProteccion>('get_estado_proteccion');
      set({ estadoProteccion });
    } catch (e) {
      console.error('Error cargando estado de proteccion:', e);
    }
  },

  toggleProteccion: async (password) => {
    try {
      const result = await invoke<boolean>('toggle_proteccion', { password });
      if (result) {
        await get().cargarEstadoProteccion();
      }
      return result;
    } catch (e) {
      console.error('Error toggling proteccion:', e);
      return false;
    }
  },

  setModoBloqueo: async (modo) => {
    try {
      await invoke('set_modo_bloqueo', { modo });
      await get().cargarEstadoProteccion();
    } catch (e) {
      console.error('Error seteando modo de bloqueo:', e);
      throw e;
    }
  },

  pauseProteccion: async (minutes, password) => {
    try {
      const result = await invoke<boolean>('pause_proteccion', { minutes, password });
      if (result) {
        await get().cargarEstadoProteccion();
      }
      return result;
    } catch (e) {
      console.error('Error pausando proteccion:', e);
      return false;
    }
  },

  cargarEstadisticas: async () => {
    try {
      const estadisticas = await invoke<Estadisticas>('get_estadisticas');
      set({ estadisticas });
    } catch (e) {
      console.error('Error cargando estadisticas:', e);
    }
  },

  cargarHistorial: async (limite = 10) => {
    try {
      const historialReciente = await invoke<EventoHistorial[]>('get_historial', { limite });
      set({ historialReciente });
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setPaginaActual: (pagina) => set({ paginaActual: pagina }),
  setProcesoActual: (proceso) => set({ procesoActual: proceso }),
}));

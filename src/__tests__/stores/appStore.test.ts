import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../stores/appStore';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('useAppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      horarios: [],
      appsBloqueadas: [],
      estadoProteccion: {
        activa: false,
        modo_bloqueo: 'MEDIUM',
        desde: null,
        hasta: null,
        focus_extremo: false,
      },
      estadisticas: {
        bloqueos_hoy: 0,
        bloqueos_semana: 0,
        racha_dias: 0,
        app_mas_tentacion: null,
      },
      historialReciente: [],
      procesoActual: null,
      sidebarCollapsed: false,
      paginaActual: 'dashboard',
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAppStore.getState();
      
      expect(state.horarios).toEqual([]);
      expect(state.appsBloqueadas).toEqual([]);
      expect(state.estadoProteccion.activa).toBe(false);
      expect(state.estadoProteccion.modo_bloqueo).toBe('MEDIUM');
      expect(state.paginaActual).toBe('dashboard');
      expect(state.sidebarCollapsed).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should set paginaActual correctly', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setPaginaActual('horarios');
      });
      
      expect(useAppStore.getState().paginaActual).toBe('horarios');
    });

    it('should toggle sidebarCollapsed state', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
      
      act(() => {
        result.current.setSidebarCollapsed(true);
      });
      
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
    });
  });

  describe('Proceso Actual', () => {
    it('should set procesoActual', () => {
      const { result } = renderHook(() => useAppStore());
      
      const proceso = { pid: 1234, nombre: 'game.exe', ruta: 'C:\\Games\\game.exe' };
      
      act(() => {
        result.current.setProcesoActual(proceso);
      });
      
      expect(useAppStore.getState().procesoActual).toEqual(proceso);
    });

    it('should clear procesoActual', () => {
      const { result } = renderHook(() => useAppStore());
      
      const proceso = { pid: 1234, nombre: 'game.exe', ruta: 'C:\\Games\\game.exe' };
      
      act(() => {
        result.current.setProcesoActual(proceso);
        result.current.setProcesoActual(null);
      });
      
      expect(useAppStore.getState().procesoActual).toBeNull();
    });
  });

  describe('cargarHorarios', () => {
    it('should load horarios from backend', async () => {
      const mockHorarios = [
        {
          id: '1',
          nombre: 'Horario Laboral',
          tipo: 'BLOQUEADO' as const,
          hora_inicio: '08:00',
          hora_fin: '18:00',
          dias: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'] as const,
          activo: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      mockInvoke.mockResolvedValueOnce(mockHorarios);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.cargarHorarios();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_horarios');
      expect(useAppStore.getState().horarios).toEqual(mockHorarios);
    });

    it('should handle error when loading horarios', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Backend error'));
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.cargarHorarios();
      });
      
      expect(useAppStore.getState().horarios).toEqual([]);
    });
  });

  describe('crearHorario', () => {
    it('should create horario and reload list', async () => {
      mockInvoke.mockResolvedValueOnce({ success: true });
      mockInvoke.mockResolvedValueOnce([]);
      
      const nuevoHorario = {
        nombre: 'Nuevo Horario',
        tipo: 'BLOQUEADO' as const,
        hora_inicio: '09:00',
        hora_fin: '17:00',
        dias: ['LUNES'] as ['LUNES'],
      };
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.crearHorario(nuevoHorario);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('create_horario', { horario: nuevoHorario });
    });

    it('should throw error when creating horario fails', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Create failed'));
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        try {
          await result.current.crearHorario({
            nombre: 'Test',
            tipo: 'BLOQUEADO',
            hora_inicio: '08:00',
            hora_fin: '18:00',
            dias: ['LUNES'],
          });
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });

  describe('eliminarHorario', () => {
    it('should delete horario and reload list', async () => {
      mockInvoke.mockResolvedValueOnce({ success: true });
      mockInvoke.mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.eliminarHorario('test-id');
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('delete_horario', { id: 'test-id' });
    });
  });

  describe('toggleHorario', () => {
    it('should toggle horario active state', async () => {
      mockInvoke.mockResolvedValueOnce({ success: true });
      mockInvoke.mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.toggleHorario('test-id');
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('toggle_horario', { id: 'test-id' });
    });
  });

  describe('cargarApps', () => {
    it('should load apps from backend', async () => {
      const mockApps = [
        {
          id: '1',
          nombre: 'GTA V',
          ruta_ejecutable: 'C:\\Games\\GTAV.exe',
          icono: null,
          hash_sha256: null,
          categoria: 'STEAM' as const,
          ultima_ejecucion: null,
          veces_ejecutado: 0,
          bloqueado: true,
          creado_en: '2024-01-01T00:00:00Z',
        },
      ];
      
      mockInvoke.mockResolvedValueOnce(mockApps);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.cargarApps();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_apps_bloqueadas');
      expect(useAppStore.getState().appsBloqueadas).toEqual(mockApps);
    });
  });

  describe('agregarApp', () => {
    it('should add app and reload list', async () => {
      mockInvoke.mockResolvedValueOnce({ success: true });
      mockInvoke.mockResolvedValueOnce([]);
      
      const nuevaApp = {
        nombre: 'Cyberpunk 2077',
        ruta_ejecutable: 'C:\\Games\\Cyberpunk2077.exe',
        categoria: 'MANUAL' as const,
      };
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.agregarApp(nuevaApp);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('add_app_bloqueada', { app: nuevaApp });
    });
  });

  describe('eliminarApp', () => {
    it('should delete app and reload list', async () => {
      mockInvoke.mockResolvedValueOnce({ success: true });
      mockInvoke.mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.eliminarApp('app-id');
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('remove_app_bloqueada', { id: 'app-id' });
    });
  });

  describe('toggleProteccion', () => {
    it('should toggle protection with valid password', async () => {
      mockInvoke.mockResolvedValueOnce(true);
      mockInvoke.mockResolvedValueOnce({
        activa: true,
        modo_bloqueo: 'MEDIUM',
        desde: null,
        hasta: null,
        focus_extremo: false,
      });
      
      const { result } = renderHook(() => useAppStore());
      
      let success = false;
      await act(async () => {
        success = await result.current.toggleProteccion('password123');
      });
      
      expect(success).toBe(true);
    });

    it('should return false with invalid password', async () => {
      mockInvoke.mockResolvedValueOnce(false);
      
      const { result } = renderHook(() => useAppStore());
      
      let success = true;
      await act(async () => {
        success = await result.current.toggleProteccion('wrong');
      });
      
      expect(success).toBe(false);
    });
  });

  describe('setModoBloqueo', () => {
    it('should set blocking mode', async () => {
      mockInvoke.mockResolvedValueOnce({ success: true });
      mockInvoke.mockResolvedValueOnce({
        activa: false,
        modo_bloqueo: 'STRICT',
        desde: null,
        hasta: null,
        focus_extremo: false,
      });
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.setModoBloqueo('STRICT');
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_modo_bloqueo', { modo: 'STRICT' });
    });
  });

  describe('pauseProteccion', () => {
    it('should pause protection for specified minutes', async () => {
      mockInvoke.mockResolvedValueOnce(true);
      mockInvoke.mockResolvedValueOnce({
        activa: false,
        modo_bloqueo: 'MEDIUM',
        desde: '2024-01-01T12:00:00Z',
        hasta: '2024-01-01T12:15:00Z',
        focus_extremo: false,
      });
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.pauseProteccion(15, 'password123');
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('pause_proteccion', { minutes: 15, password: 'password123' });
    });
  });

  describe('cargarEstadisticas', () => {
    it('should load statistics from backend', async () => {
      const mockStats = {
        bloqueos_hoy: 5,
        bloqueos_semana: 23,
        racha_dias: 7,
        app_mas_tentacion: { id: '1', nombre: 'GTA V', cantidad: 10 },
      };
      
      mockInvoke.mockResolvedValueOnce(mockStats);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.cargarEstadisticas();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_estadisticas');
      expect(useAppStore.getState().estadisticas).toEqual(mockStats);
    });
  });

  describe('cargarHistorial', () => {
    it('should load recent history', async () => {
      const mockHistorial = [
        {
          id: '1',
          app_id: 'app-1',
          app_nombre: 'GTA V',
          tipo_evento: 'BLOQUEO' as const,
          timestamp: '2024-01-01T12:00:00Z',
          modo_bloqueo: 'MEDIUM' as const,
          duracion_proceso_ms: 5000,
          detalles: {},
        },
      ];
      
      mockInvoke.mockResolvedValueOnce(mockHistorial);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.cargarHistorial(10);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_historial', { limite: 10 });
      expect(useAppStore.getState().historialReciente).toEqual(mockHistorial);
    });

    it('should use default limit of 10', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        await result.current.cargarHistorial();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_historial', { limite: 10 });
    });
  });

  describe('detectarSteamGames', () => {
    it('should return detected Steam games', async () => {
      const mockGames = [
        {
          id: 'steam-1',
          nombre: 'Cyberpunk 2077',
          ruta_ejecutable: 'C:\\Games\\Cyberpunk2077.exe',
          icono: null,
          hash_sha256: null,
          categoria: 'STEAM' as const,
          ultima_ejecucion: null,
          veces_ejecutado: 0,
          bloqueado: true,
          creado_en: '2024-01-01T00:00:00Z',
        },
      ];
      
      mockInvoke.mockResolvedValueOnce(mockGames);
      
      const { result } = renderHook(() => useAppStore());
      
      await act(async () => {
        const games = await result.current.detectarSteamGames();
        expect(games).toEqual(mockGames);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('detect_steam_games');
    });

    it('should return empty array on error', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Detection failed'));
      
      const { result } = renderHook(() => useAppStore());
      
      let games: any[] = [];
      await act(async () => {
        games = await result.current.detectarSteamGames();
      });
      
      expect(games).toEqual([]);
    });
  });

  describe('getRunningProcesses', () => {
    it('should return list of running processes', async () => {
      const mockProcesses = [
        { pid: 100, nombre: 'explorer.exe', ruta: 'C:\\Windows\\explorer.exe' },
        { pid: 200, nombre: 'game.exe', ruta: 'C:\\Games\\game.exe' },
      ];
      
      mockInvoke.mockResolvedValueOnce(mockProcesses);
      
      const { result } = renderHook(() => useAppStore());
      
      let processes: any[] = [];
      await act(async () => {
        processes = await result.current.getRunningProcesses();
      });
      
      expect(processes).toEqual(mockProcesses);
      expect(mockInvoke).toHaveBeenCalledWith('get_running_processes');
    });
  });
});

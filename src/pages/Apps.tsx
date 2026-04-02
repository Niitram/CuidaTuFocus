import { useEffect, useState } from 'react';
import { Plus, Gamepad2, Trash2, Search, Monitor, FolderOpen, RefreshCw, X } from 'lucide-react';
import { Card, Button, Toggle } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import type { AppBloqueada, ProcessInfo, NuevaApp } from '../types';

const CATEGORIAS_MAP = {
  STEAM: { label: 'Steam', color: 'bg-[#1b9ed8]/20 text-[#1b9ed8]' },
  EPIC: { label: 'Epic', color: 'bg-[#2a2a2a] text-white' },
  GOG: { label: 'GOG', color: 'bg-[#86328a]/20 text-[#86328a]' },
  MANUAL: { label: 'Manual', color: 'bg-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)]' },
  DETECTADO: { label: 'Detectado', color: 'bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)]' },
};

export function Apps() {
  const { appsBloqueadas, cargarApps, agregarApp, eliminarApp, toggleApp, detectarSteamGames, getRunningProcesses } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingSteam, setLoadingSteam] = useState(false);
  const [steamGames, setSteamGames] = useState<AppBloqueada[]>([]);

  useEffect(() => {
    cargarApps();
  }, []);

  const filteredApps = appsBloqueadas.filter(app => 
    app.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [steamModalStep, setSteamModalStep] = useState<'menu' | 'steam' | 'procesos' | 'manual'>('menu');

  const handleDetectarSteam = async () => {
    setLoadingSteam(true);
    try {
      const games = await detectarSteamGames();
      setSteamGames(games);
      if (games.length > 0) {
        setShowAddModal(true);
        setSteamModalStep('steam');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSteam(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Apps Bloqueadas</h1>
          <p className="text-[var(--color-text-secondary)]">Gestiona los juegos que querés bloquear</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Agregar app
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
          />
        </div>
        <Button variant="secondary" onClick={() => handleDetectarSteam()} disabled={loadingSteam}>
          <RefreshCw size={18} className={loadingSteam ? 'animate-spin' : ''} />
          Detectar Steam
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => (
          <Card key={app.id} className="relative">
            <div className="absolute top-4 right-4">
              <Toggle
                checked={app.bloqueado}
                onChange={() => toggleApp(app.id)}
              />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--color-accent-primary)]/20 flex items-center justify-center overflow-hidden">
                {app.icono ? (
                  <img src={app.icono} alt={app.nombre} className="w-10 h-10 object-contain" />
                ) : (
                  <Gamepad2 size={28} className="text-[var(--color-accent-primary)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--color-text-primary)] truncate">{app.nombre}</h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${CATEGORIAS_MAP[app.categoria].color}`}>
                  {CATEGORIAS_MAP[app.categoria].label}
                </span>
                {app.ultimaEjecucion && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Ultima vez: {new Date(app.ultimaEjecucion).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
              <button
                onClick={() => eliminarApp(app.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-danger)] hover:bg-[var(--color-accent-danger)]/10 transition-colors text-sm"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <Card className="text-center py-12">
          <Gamepad2 size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No hay apps bloqueadas</h3>
          <p className="text-[var(--color-text-secondary)] mb-4">Agregá juegos para empezar a bloquearlos</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Agregar app
          </Button>
        </Card>
      )}

      {showAddModal && (
        <AddAppModal
          steamGames={steamGames}
          onClose={() => { setShowAddModal(false); setSteamGames([]); setSteamModalStep('menu'); }}
          onAdd={agregarApp}
          onDetectSteam={() => handleDetectarSteam()}
          getProcesses={getRunningProcesses}
          initialStep={steamModalStep}
        />
      )}
    </div>
  );
}

interface AddAppModalProps {
  steamGames: AppBloqueada[];
  onClose: () => void;
  onAdd: (app: NuevaApp) => Promise<void>;
  onDetectSteam: () => Promise<void>;
  getProcesses: () => Promise<ProcessInfo[]>;
  initialStep?: 'menu' | 'steam' | 'procesos' | 'manual';
}

function AddAppModal({ steamGames, onClose, onAdd, onDetectSteam, getProcesses, initialStep = 'menu' }: AddAppModalProps) {
  const [step, setStep] = useState<'menu' | 'steam' | 'procesos' | 'manual'>(initialStep);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [nombre, setNombre] = useState('');
  const [ruta, setRuta] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectSteamGame = async (game: AppBloqueada) => {
    setLoading(true);
    try {
      await onAdd({
        nombre: game.nombre,
        rutaEjecutable: game.rutaEjecutable,
        categoria: 'STEAM'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProcess = async (proc: ProcessInfo) => {
    setLoading(true);
    try {
      await onAdd({
        nombre: proc.nombre.replace('.exe', ''),
        rutaEjecutable: proc.ruta,
        categoria: 'DETECTADO'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!nombre || !ruta) return;
    setLoading(true);
    try {
      await onAdd({ nombre, rutaEjecutable: ruta, categoria: 'MANUAL' });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProcesses = async () => {
    const procs = await getProcesses();
    setProcesses(procs.filter(p => p.nombre.toLowerCase().endsWith('.exe')));
    setStep('procesos');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-lg m-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Agregar app</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-[var(--radius-sm)]">
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {step === 'menu' && (
          <div className="space-y-3">
            <Button variant="secondary" onClick={onDetectSteam} className="w-full justify-start">
              <FolderOpen size={18} />
              Detectar juegos de Steam
            </Button>
            <Button variant="secondary" onClick={handleLoadProcesses} className="w-full justify-start">
              <Monitor size={18} />
              Desde proceso activo
            </Button>
            <Button variant="secondary" onClick={() => setStep('manual')} className="w-full justify-start">
              <Plus size={18} />
              Agregar manualmente
            </Button>
          </div>
        )}

        {step === 'steam' && (
          <div className="space-y-3">
            {steamGames.length === 0 ? (
              <p className="text-center text-[var(--color-text-secondary)] py-8">
                No se encontraron juegos de Steam
              </p>
            ) : (
              steamGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleSelectSteamGame(game)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors text-left"
                >
                  <Gamepad2 size={20} className="text-[var(--color-accent-primary)]" />
                  <span className="text-[var(--color-text-primary)]">{game.nombre}</span>
                </button>
              ))
            )}
            <Button variant="ghost" onClick={() => setStep('menu')} className="w-full mt-4">
              Volver
            </Button>
          </div>
        )}

        {step === 'procesos' && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {processes.length === 0 ? (
              <p className="text-center text-[var(--color-text-secondary)] py-8">
                No hay procesos activos
              </p>
            ) : (
              processes.slice(0, 50).map(proc => (
                <button
                  key={proc.pid}
                  onClick={() => handleSelectProcess(proc)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors text-left"
                >
                  <Monitor size={18} className="text-[var(--color-text-muted)]" />
                  <div className="min-w-0">
                    <p className="text-[var(--color-text-primary)] truncate">{proc.nombre}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{proc.ruta}</p>
                  </div>
                </button>
              ))
            )}
            <Button variant="ghost" onClick={() => setStep('menu')} className="w-full mt-4">
              Volver
            </Button>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre del juego"
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Ruta del ejecutable</label>
              <input
                type="text"
                value={ruta}
                onChange={e => setRuta(e.target.value)}
                placeholder="C:\Games\game.exe"
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setStep('menu')} className="flex-1">
                Volver
              </Button>
              <Button onClick={handleManualAdd} disabled={loading || !nombre || !ruta} className="flex-1">
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

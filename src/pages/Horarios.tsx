import { useEffect, useState } from 'react';
import { Plus, Clock, Trash2, X, Layers, Users } from 'lucide-react';
import { Card, Button, Toggle, Badge } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import type { Horario, DiaSemana, NuevoHorario, NuevoGrupoHorario, AppBloqueada } from '../types';

const DIAS_SEMANA: { value: DiaSemana; label: string; short: string }[] = [
  { value: 'LUNES', label: 'Lunes', short: 'L' },
  { value: 'MARTES', label: 'Martes', short: 'M' },
  { value: 'MIERCOLES', label: 'Miércoles', short: 'X' },
  { value: 'JUEVES', label: 'Jueves', short: 'J' },
  { value: 'VIERNES', label: 'Viernes', short: 'V' },
  { value: 'SABADO', label: 'Sábado', short: 'S' },
  { value: 'DOMINGO', label: 'Domingo', short: 'D' },
];

const HORAS = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
);

export function Horarios() {
  const { 
    horarios, gruposHorarios, appsBloqueadas,
    cargarHorarios, crearHorario, eliminarHorario, toggleHorario,
    cargarGruposHorarios, crearGrupoHorario, eliminarGrupoHorario, toggleGrupoHorario,
    cargarApps
  } = useAppStore();
  
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [viewMode, setViewMode] = useState<'horarios' | 'grupos'>('horarios');

  useEffect(() => {
    cargarHorarios();
    cargarGruposHorarios();
    cargarApps();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Horarios</h1>
          <p className="text-[var(--color-text-secondary)]">Configurá franjas horarias y grupos para tus apps</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'horarios' ? 'secondary' : 'ghost'} onClick={() => setViewMode('horarios')}>
            <Clock size={18} />
            Horarios
          </Button>
          <Button variant={viewMode === 'grupos' ? 'secondary' : 'ghost'} onClick={() => setViewMode('grupos')}>
            <Layers size={18} />
            Grupos
          </Button>
          <Button onClick={() => viewMode === 'horarios' ? setShowModal(true) : setShowGroupModal(true)}>
            <Plus size={18} />
            {viewMode === 'horarios' ? 'Agregar horario' : 'Crear grupo'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 p-4 rounded-[var(--radius-md)] bg-[var(--color-accent-danger)]/10 border border-[var(--color-accent-danger)]/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[var(--color-accent-danger)]" />
            <span className="font-medium text-[var(--color-text-primary)]">Bloqueado</span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">8:00 - 18:00 (Lun-Vie)</p>
        </div>
        <div className="flex-1 p-4 rounded-[var(--radius-md)] bg-[var(--color-accent-success)]/10 border border-[var(--color-accent-success)]/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[var(--color-accent-success)]" />
            <span className="font-medium text-[var(--color-text-primary)]">Permitido</span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">18:00 - 8:00 (Lun-Vie)</p>
        </div>
      </div>

      {viewMode === 'horarios' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {horarios.map((horario) => (
              <Card key={horario.id} className="relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Toggle
                    checked={horario.activo}
                    onChange={() => toggleHorario(horario.id)}
                  />
                  <button
                    onClick={() => eliminarHorario(horario.id)}
                    className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-accent-danger)] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center ${
                    horario.tipo === 'BLOQUEADO' 
                      ? 'bg-[var(--color-accent-danger)]/20' 
                      : 'bg-[var(--color-accent-success)]/20'
                  }`}>
                    <Clock size={24} className={horario.tipo === 'BLOQUEADO' ? 'text-[var(--color-accent-danger)]' : 'text-[var(--color-accent-success)]'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--color-text-primary)]">{horario.nombre}</h3>
                      <Badge variant={horario.tipo === 'BLOQUEADO' ? 'danger' : 'success'}>
                        {horario.tipo}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 relative h-8 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full rounded-full ${horario.tipo === 'BLOQUEADO' ? 'bg-[var(--color-accent-danger)]/40' : 'bg-[var(--color-accent-success)]/40'}`}
                        style={{
                          left: `${(parseInt(horario.horaInicio.split(':')[0]) / 24) * 100}%`,
                          width: `${((parseInt(horario.horaFin.split(':')[0]) - parseInt(horario.horaInicio.split(':')[0]) + 24) % 24 / 24) * 100}%`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-[var(--color-text-muted)]">
                        <span>0h</span>
                        <span>6h</span>
                        <span>12h</span>
                        <span>18h</span>
                        <span>24h</span>
                      </div>
                    </div>
                    
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-2">
                      {horario.horaInicio} – {horario.horaFin}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {DIAS_SEMANA.map((dia) => (
                        <div
                          key={dia.value}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                            horario.dias.includes(dia.value)
                              ? 'bg-[var(--color-accent-primary)] text-white'
                              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                          }`}
                          title={dia.label}
                        >
                          {dia.short}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {horarios.length === 0 && (
            <Card className="text-center py-12">
              <Clock size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No hay horarios configurados</h3>
              <p className="text-[var(--color-text-secondary)] mb-4">Agregá tu primer horario para empezar</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={18} />
                Crear horario
              </Button>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {gruposHorarios.map((grupo) => {
              const horariosInGrupo = grupo.horariosIds.map(id => horarios.find(h => h.id === id)).filter(Boolean) as Horario[];
              const appsInGrupo = grupo.appsIds.map(id => appsBloqueadas.find(a => a.id === id)).filter((a): a is AppBloqueada => Boolean(a));
              
              return (
                <Card key={grupo.id} className="relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Toggle
                      checked={grupo.activo}
                      onChange={() => toggleGrupoHorario(grupo.id)}
                    />
                    <button
                      onClick={() => eliminarGrupoHorario(grupo.id)}
                      className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-accent-danger)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-accent-primary)]/20 flex items-center justify-center">
                      <Layers size={24} className="text-[var(--color-accent-primary)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--color-text-primary)]">{grupo.nombre}</h3>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                          <Clock size={14} />
                          <span>Horarios: {horariosInGrupo.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {horariosInGrupo.slice(0, 3).map((h) => (
                            <Badge key={h.id} variant={h.tipo === 'BLOQUEADO' ? 'danger' : 'success'}>
                              {h.nombre}
                            </Badge>
                          ))}
                          {horariosInGrupo.length > 3 && (
                            <Badge variant="default">+{horariosInGrupo.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Users size={14} />
                        <span>Apps: {appsInGrupo.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {appsInGrupo.slice(0, 3).map((a) => (
                          <span key={a.id} className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                            {a.nombre}
                          </span>
                        ))}
                        {appsInGrupo.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                            +{appsInGrupo.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {gruposHorarios.length === 0 && (
            <Card className="text-center py-12">
              <Layers size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No hay grupos de horarios</h3>
              <p className="text-[var(--color-text-secondary)] mb-4">Creá grupos para asignar múltiples horarios a tus apps</p>
              <Button onClick={() => setShowGroupModal(true)}>
                <Plus size={18} />
                Crear grupo
              </Button>
            </Card>
          )}
        </div>
      )}

      {showModal && (
        <HorarioModal
          onClose={() => setShowModal(false)}
          onSave={crearHorario}
        />
      )}

      {showGroupModal && (
        <GrupoHorarioModal
          onClose={() => setShowGroupModal(false)}
          onSave={crearGrupoHorario}
          horarios={horarios}
          apps={appsBloqueadas}
        />
      )}
    </div>
  );
}

interface HorarioModalProps {
  onClose: () => void;
  onSave: (horario: NuevoHorario) => Promise<void>;
  initialData?: Horario;
}

function HorarioModal({ onClose, onSave, initialData }: HorarioModalProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [tipo, setTipo] = useState<'BLOQUEADO' | 'PERMITIDO'>(initialData?.tipo || 'BLOQUEADO');
  const [horaInicio, setHoraInicio] = useState(initialData?.horaInicio || '08:00');
  const [horaFin, setHoraFin] = useState(initialData?.horaFin || '18:00');
  const [dias, setDias] = useState<DiaSemana[]>(initialData?.dias || ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']);
  const [saving, setSaving] = useState(false);

  const toggleDia = (dia: DiaSemana) => {
    setDias(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dias.length === 0) return;
    
    setSaving(true);
    try {
      await onSave({ nombre, tipo, horaInicio, horaFin, dias });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar horario' : 'Nuevo horario'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-[var(--radius-sm)]">
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Horario laboral"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo('BLOQUEADO')}
                className={`flex-1 py-2.5 rounded-[var(--radius-md)] font-medium transition-colors ${
                  tipo === 'BLOQUEADO'
                    ? 'bg-[var(--color-accent-danger)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                Bloqueado
              </button>
              <button
                type="button"
                onClick={() => setTipo('PERMITIDO')}
                className={`flex-1 py-2.5 rounded-[var(--radius-md)] font-medium transition-colors ${
                  tipo === 'PERMITIDO'
                    ? 'bg-[var(--color-accent-success)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                Permitido
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Desde</label>
              <select
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              >
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Hasta</label>
              <select
                value={horaFin}
                onChange={e => setHoraFin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              >
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Días</label>
            <div className="flex gap-2">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => toggleDia(dia.value)}
                  className={`w-10 h-10 rounded-full font-medium transition-colors ${
                    dias.includes(dia.value)
                      ? 'bg-[var(--color-accent-primary)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {dia.short}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || dias.length === 0} className="flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

interface GrupoHorarioModalProps {
  onClose: () => void;
  onSave: (grupo: NuevoGrupoHorario) => Promise<void>;
  horarios: Horario[];
  apps: AppBloqueada[];
}

function GrupoHorarioModal({ onClose, onSave, horarios, apps }: GrupoHorarioModalProps) {
  const [nombre, setNombre] = useState('');
  const [selectedHorarios, setSelectedHorarios] = useState<string[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleHorario = (id: string) => {
    setSelectedHorarios(prev => 
      prev.includes(id) 
        ? prev.filter(h => h !== id)
        : [...prev, id]
    );
  };

  const toggleApp = (id: string) => {
    setSelectedApps(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || selectedHorarios.length === 0) return;
    
    setSaving(true);
    try {
      await onSave({ nombre, horariosIds: selectedHorarios, appsIds: selectedApps });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-lg m-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Nuevo grupo de horarios</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-[var(--radius-sm)]">
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nombre del grupo</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Juegos nocturnos"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Horarios en el grupo</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {horarios.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No hay horarios creados. Creá horarios primero.</p>
              ) : (
                horarios.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHorario(h.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors ${
                      selectedHorarios.includes(h.id)
                        ? 'bg-[var(--color-accent-primary)]/20 border border-[var(--color-accent-primary)]'
                        : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedHorarios.includes(h.id)
                        ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                        : 'border-[var(--color-text-muted)]'
                    }`}>
                      {selectedHorarios.includes(h.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[var(--color-text-primary)]">{h.nombre}</span>
                      <span className="text-xs text-[var(--color-text-muted)] ml-2">{h.horaInicio} - {h.horaFin}</span>
                    </div>
                    <Badge variant={h.tipo === 'BLOQUEADO' ? 'danger' : 'success'}>{h.tipo}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Apps en el grupo (opcional)</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {apps.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No hay apps bloqueadas. Agregá apps primero.</p>
              ) : (
                apps.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleApp(a.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors ${
                      selectedApps.includes(a.id)
                        ? 'bg-[var(--color-accent-primary)]/20 border border-[var(--color-accent-primary)]'
                        : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedApps.includes(a.id)
                        ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                        : 'border-[var(--color-text-muted)]'
                    }`}>
                      {selectedApps.includes(a.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[var(--color-text-primary)]">{a.nombre}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !nombre || selectedHorarios.length === 0} className="flex-1">
              {saving ? 'Guardando...' : 'Crear grupo'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
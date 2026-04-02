import { useEffect, useState } from 'react';
import { Plus, Clock, Trash2, X } from 'lucide-react';
import { Card, Button, Toggle, Badge } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import type { Horario, DiaSemana, NuevoHorario } from '../types';

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
  const { horarios, cargarHorarios, crearHorario, eliminarHorario, toggleHorario } = useAppStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarHorarios();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Horarios</h1>
          <p className="text-[var(--color-text-secondary)]">Configurá las franjas horarias de bloqueo</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Agregar horario
        </Button>
      </div>

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
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {horario.hora_inicio} – {horario.hora_fin}
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

      {showModal && (
        <HorarioModal
          onClose={() => setShowModal(false)}
          onSave={crearHorario}
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
  const [horaInicio, setHoraInicio] = useState(initialData?.hora_inicio || '08:00');
  const [horaFin, setHoraFin] = useState(initialData?.hora_fin || '18:00');
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
      await onSave({ nombre, tipo, hora_inicio: horaInicio, hora_fin: horaFin, dias });
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

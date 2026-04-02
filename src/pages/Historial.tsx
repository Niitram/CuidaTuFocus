import { useEffect, useState } from 'react';
import { History, Gamepad2, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, Badge } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { format, parseISO, startOfWeek, startOfMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventoHistorial } from '../types';

type FiltroPeriodo = 'hoy' | 'semana' | 'mes' | 'todos';

export function Historial() {
  const { historialReciente, cargarHistorial } = useAppStore();
  const [filtro, setFiltro] = useState<FiltroPeriodo>('hoy');
  const [events, setEvents] = useState<EventoHistorial[]>([]);

  useEffect(() => {
    cargarHistorial(100);
  }, []);

  useEffect(() => {
    const now = new Date();
    let filtered = [...historialReciente];

    switch (filtro) {
      case 'hoy':
        filtered = historialReciente.filter(e => isToday(parseISO(e.timestamp)));
        break;
      case 'semana':
        const weekStart = startOfWeek(now, { locale: es });
        filtered = historialReciente.filter(e => parseISO(e.timestamp) >= weekStart);
        break;
      case 'mes':
        const monthStart = startOfMonth(now);
        filtered = historialReciente.filter(e => parseISO(e.timestamp) >= monthStart);
        break;
      default:
        filtered = historialReciente;
    }

    setEvents(filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [filtro, historialReciente]);

  const bloqueosCount = events.filter(e => e.tipo_evento === 'BLOQUEO').length;
  const bloqueosPorHora = events.reduce((acc, e) => {
    if (e.tipo_evento === 'BLOQUEO') {
      const hora = format(parseISO(e.timestamp), 'HH');
      acc[hora] = (acc[hora] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const horaMasBloqueos = Object.entries(bloqueosPorHora).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Historial</h1>
          <p className="text-[var(--color-text-secondary)]">Registro de actividad y bloqueos</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['hoy', 'semana', 'mes', 'todos'] as FiltroPeriodo[]).map((periodo) => (
          <button
            key={periodo}
            onClick={() => setFiltro(periodo)}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
              filtro === periodo
                ? 'bg-[var(--color-accent-primary)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : periodo === 'mes' ? 'Este mes' : 'Todos'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-danger)]/20 flex items-center justify-center">
            <Gamepad2 size={24} className="text-[var(--color-accent-danger)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Bloqueos en período</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{bloqueosCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-warning)]/20 flex items-center justify-center">
            <TrendingUp size={24} className="text-[var(--color-accent-warning)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Hora más temptación</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {horaMasBloqueos ? `${horaMasBloqueos[0]}:00` : '--:--'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-secondary)]/20 flex items-center justify-center">
            <Calendar size={24} className="text-[var(--color-accent-secondary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Total eventos</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{events.length}</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Registro de eventos" icon={<History size={20} />} />
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <History size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">No hay eventos en este período</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((evento) => (
              <div
                key={evento.id}
                className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  evento.tipo_evento === 'BLOQUEO'
                    ? 'bg-[var(--color-accent-danger)]/20'
                    : evento.tipo_evento === 'INTENTO_BLOQUEO'
                    ? 'bg-[var(--color-accent-warning)]/20'
                    : 'bg-[var(--color-accent-success)]/20'
                }`}>
                  <Gamepad2 size={18} className={
                    evento.tipo_evento === 'BLOQUEO'
                      ? 'text-[var(--color-accent-danger)]'
                      : evento.tipo_evento === 'INTENTO_BLOQUEO'
                      ? 'text-[var(--color-accent-warning)]'
                      : 'text-[var(--color-accent-success)]'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)] truncate">{evento.app_nombre}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {format(parseISO(evento.timestamp), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </p>
                </div>

                <Badge variant={
                  evento.tipo_evento === 'BLOQUEO'
                    ? 'danger'
                    : evento.tipo_evento === 'INTENTO_BLOQUEO'
                    ? 'warning'
                    : 'success'
                }>
                  {evento.tipo_evento === 'BLOQUEO' ? 'Bloqueado' 
                    : evento.tipo_evento === 'INTENTO_BLOQUEO' ? 'Intento' 
                    : 'Permitido'}
                </Badge>

                <div className="text-right text-xs text-[var(--color-text-muted)] w-20">
                  Modo {evento.modo_bloqueo.toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

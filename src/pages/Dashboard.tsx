import { useEffect } from 'react';
import { Shield, ShieldOff, Clock, Gamepad2, TrendingUp, AlertTriangle, Play, X } from 'lucide-react';
import { Card, CardHeader, Toggle, Badge, ProgressRing } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const { 
    estadoProteccion, 
    estadisticas, 
    historialReciente, 
    horarios,
    appsBloqueadas,
    toggleProteccion,
    cargarEstadoProteccion,
    cargarEstadisticas,
    cargarHistorial,
    cargarHorarios,
    cargarApps
  } = useAppStore();

  useEffect(() => {
    cargarEstadoProteccion();
    cargarEstadisticas();
    cargarHistorial(5);
    cargarHorarios();
    cargarApps();
  }, []);

  const handleToggleProteccion = async () => {
    const password = prompt('Ingresá la contraseña para cambiar el estado de protección:');
    if (password) {
      await toggleProteccion(password);
    }
  };

  const proximoCambio = () => {
    if (!horarios || horarios.length === 0) return null;
    
    const ahora = new Date();
    const hoy = ahora.getDay();
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const diaActual = diasSemana[hoy];

    const horariosActivos = horarios.filter(h => h.activo && h.dias.includes(diaActual as any));
    
    for (const horario of horariosActivos) {
      if (!horario.hora_fin) continue;
      const [hFin] = horario.hora_fin.split(':').map(Number);
      const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
      const finMin = hFin * 60;
      
      if (finMin > ahoraMin) {
        const diff = finMin - ahoraMin;
        return {
          tipo: horario.tipo === 'BLOQUEADO' ? 'permitido' : 'bloqueado',
          minutos: diff,
          hora: horario.hora_fin
        };
      }
    }

    return null;
  };

  const proximo = proximoCambio();

  const bloquearAppsCount = appsBloqueadas.filter(a => a.bloqueado).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-[var(--color-text-secondary)]">Estado actual de tu protección</p>
        </div>
        <Toggle
          checked={estadoProteccion.activa}
          onChange={handleToggleProteccion}
          label={estadoProteccion.activa ? 'Protección activa' : 'Protección inactiva'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${estadoProteccion.activa ? 'bg-[var(--color-accent-success)]/20' : 'bg-[var(--color-accent-danger)]/20'}`}>
            {estadoProteccion.activa ? <Shield size={24} className="text-[var(--color-accent-success)]" /> : <ShieldOff size={24} className="text-[var(--color-accent-danger)]" />}
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Estado</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{estadoProteccion.activa ? 'Activo' : 'Inactivo'}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center">
            <Gamepad2 size={24} className="text-[var(--color-accent-primary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Apps bloqueadas</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{bloquearAppsCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-warning)]/20 flex items-center justify-center">
            <TrendingUp size={24} className="text-[var(--color-accent-warning)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Bloqueos hoy</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{estadisticas.bloqueos_hoy}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-secondary)]/20 flex items-center justify-center">
            <Clock size={24} className="text-[var(--color-accent-secondary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Racha actual</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{estadisticas.racha_dias} días</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader 
            title="Próximo cambio de estado" 
            subtitle="Tiempo hasta el próximo cambio"
            icon={<Clock size={20} />}
          />
          {proximo ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={proximo.tipo === 'permitido' ? 'success' : 'warning'}>
                  {proximo.tipo === 'permitido' ? 'Se permite' : 'Se bloquea'}
                </Badge>
                <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
                  {proximo.hora}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  en {proximo.minutos} minutos
                </p>
              </div>
              <ProgressRing 
                progress={100 - (proximo.minutos / 60) * 100} 
                color={proximo.tipo === 'permitido' ? 'var(--color-accent-success)' : 'var(--color-accent-warning)'}
              />
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)]">No hay cambios programados</p>
          )}
        </Card>

        <Card>
          <CardHeader 
            title="Actividad reciente" 
            subtitle="Últimos eventos"
            icon={<AlertTriangle size={20} />}
          />
          {historialReciente.length > 0 ? (
            <div className="space-y-3">
              {historialReciente.map((evento) => (
                <div key={evento.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    evento.tipo_evento === 'BLOQUEO' 
                      ? 'bg-[var(--color-accent-danger)]/20' 
                      : 'bg-[var(--color-accent-success)]/20'
                  }`}>
                    {evento.tipo_evento === 'BLOQUEO' 
                      ? <X size={16} className="text-[var(--color-accent-danger)]" />
                      : <Play size={16} className="text-[var(--color-accent-success)]" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{evento.app_nombre}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {format(parseISO(evento.timestamp), "HH:mm 'hrs'", { locale: es })}
                    </p>
                  </div>
                  <Badge variant={evento.tipo_evento === 'BLOQUEO' ? 'danger' : 'success'}>
                    {evento.tipo_evento === 'BLOQUEO' ? 'Bloqueado' : 'Permitido'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)]">No hay actividad reciente</p>
          )}
        </Card>
      </div>

      {estadisticas.app_mas_tentacion && (
        <Card className="bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-accent-danger)]/10 border-[var(--color-accent-danger)]/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--color-accent-danger)]/20 flex items-center justify-center">
              <AlertTriangle size={28} className="text-[var(--color-accent-danger)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">App más tentación</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{estadisticas.app_mas_tentacion.nombre}</p>
              <p className="text-sm text-[var(--color-accent-danger)]">{estadisticas.app_mas_tentacion.cantidad} bloqueos esta semana</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

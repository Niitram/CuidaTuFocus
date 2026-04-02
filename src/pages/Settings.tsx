import { useEffect, useState } from 'react';
import { Shield, Bell, Lock, Info, Check, X } from 'lucide-react';
import { Card, CardHeader, Button, Toggle } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import type { ModoBloqueo } from '../types';

const MODOS_BLOQUEO: { value: ModoBloqueo; label: string; desc: string }[] = [
  { value: 'SOFT', label: 'Suave', desc: 'Cierra el juego silenciosamente' },
  { value: 'MEDIUM', label: 'Medio', desc: 'Muestra advertencia antes de cerrar' },
  { value: 'STRICT', label: 'Estricto', desc: 'Bloqueo inmediato sin aviso' },
];

const FRASES_MOTIVACIONALES = [
  "Tu futuro yo te lo va a agradecer",
  "Cada minuto cuenta. Volvé al foco 💪",
  "Los pequeños sacrificios generan grandes resultados",
  "Hoy sacrificás el juego, mañana cosechás el éxito",
  "El disciplina es elegir entre lo que quieres ahora y lo que quieres después",
];

export function Settings() {
  const { estadoProteccion, setModoBloqueo, cargarEstadoProteccion, toggleProteccion } = useAppStore();
  const [sonido, setSonido] = useState(true);
  const [notificaciones, setNotificaciones] = useState(true);
  const [mostrarPasswordModal, setMostrarPasswordModal] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    cargarEstadoProteccion();
  }, []);

  const handleToggleProteccion = async () => {
    const password = prompt('Ingresá la contraseña:');
    if (password) {
      const success = await toggleProteccion(password);
      if (!success) {
        alert('Contraseña incorrecta');
      }
    }
  };

  const handleCambiarPassword = async () => {
    if (nuevaPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nuevaPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    setPasswordError('');
    setMostrarPasswordModal(false);
    setNuevaPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Configuración</h1>
        <p className="text-[var(--color-text-secondary)]">Personalizá tu experiencia</p>
      </div>

      <Card>
        <CardHeader title="Protección" subtitle="Estado y modo de bloqueo" icon={<Shield size={20} />} />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Protección activa</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {estadoProteccion.activa ? 'Los juegos están siendo monitoreados' : 'La protección está desactivada'}
              </p>
            </div>
            <Toggle
              checked={estadoProteccion.activa}
              onChange={handleToggleProteccion}
            />
          </div>

          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
            <p className="font-medium text-[var(--color-text-primary)] mb-3">Modo de bloqueo</p>
            <div className="space-y-2">
              {MODOS_BLOQUEO.map((modo) => (
                <button
                  key={modo.value}
                  onClick={() => setModoBloqueo(modo.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors ${
                    estadoProteccion.modo_bloqueo === modo.value
                      ? 'bg-[var(--color-accent-primary)]/20 border border-[var(--color-accent-primary)]'
                      : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-primary)]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    estadoProteccion.modo_bloqueo === modo.value
                      ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]'
                      : 'border-[var(--color-text-muted)]'
                  }`}>
                    {estadoProteccion.modo_bloqueo === modo.value && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--color-text-primary)]">{modo.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{modo.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Contraseña" subtitle="Proteger con contraseña" icon={<Lock size={20} />} />
        <div className="space-y-4">
          <Button variant="secondary" onClick={() => setMostrarPasswordModal(true)}>
            Cambiar contraseña
          </Button>
          <p className="text-sm text-[var(--color-text-muted)]">
            La contraseña se requiere para desactivar la protección o desinstalar la app.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Notificaciones" subtitle="Configurar alertas" icon={<Bell size={20} />} />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Mostrar notificaciones</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Notificar cuando se bloquea un juego
              </p>
            </div>
            <Toggle
              checked={notificaciones}
              onChange={setNotificaciones}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Sonido</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Reproducir sonido al bloquear
              </p>
            </div>
            <Toggle
              checked={sonido}
              onChange={setSonido}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Frases motivacionales" icon={<Info size={20} />} />
        <div className="space-y-2">
          {FRASES_MOTIVACIONALES.map((frase, i) => (
            <div key={i} className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
              <p className="text-sm text-[var(--color-text-primary)] italic">"{frase}"</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Acerca de" icon={<Info size={20} />} />
        <div className="space-y-2">
          <div className="flex justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
            <span className="text-[var(--color-text-secondary)]">Versión</span>
            <span className="text-[var(--color-text-primary)]">1.0.0</span>
          </div>
          <div className="flex justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)]">
            <span className="text-[var(--color-text-secondary)]">Hecho con</span>
            <span className="text-[var(--color-text-primary)]">Tauri + React</span>
          </div>
        </div>
      </Card>

      {mostrarPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Cambiar contraseña</h2>
              <button onClick={() => setMostrarPasswordModal(false)} className="p-1 hover:bg-white/10 rounded-[var(--radius-sm)]">
                <X size={20} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={e => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-[var(--color-accent-danger)]">{passwordError}</p>
              )}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setMostrarPasswordModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCambiarPassword} className="flex-1">
                  Guardar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

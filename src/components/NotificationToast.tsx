import { useEffect, useState } from 'react';
import { X, Shield, AlertTriangle, Info } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import type { NotificationPayload } from '../types';
import { useAppStore } from '../stores/appStore';

const FRASES_MOTIVACIONALES = [
  "Tu futuro yo te lo va a agradecer",
  "Cada minuto cuenta. Volvé al foco 💪",
  "Los pequeños sacrificios generan grandes resultados",
  "Hoy sacrificás el juego, mañana cosechás el éxito",
];

export function NotificationToast() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { cargarHistorial, cargarEstadisticas } = useAppStore();

  useEffect(() => {
    const unlisten = listen<NotificationPayload>('bloqueo-event', (event) => {
      setNotification(event.payload);
      setVisible(true);
      setCountdown(5);
      
      cargarHistorial(5);
      cargarEstadisticas();
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  useEffect(() => {
    if (!visible || !notification) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, notification]);

  useEffect(() => {
    if (countdown === 0 && notification?.modo === 'MEDIUM') {
      setVisible(false);
      setTimeout(() => setNotification(null), 300);
    }
  }, [countdown, notification]);

  const closeNotification = () => {
    setVisible(false);
    setTimeout(() => setNotification(null), 300);
  };

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.modo) {
      case 'SOFT':
        return <Shield size={24} className="text-[var(--color-accent-secondary)]" />;
      case 'MEDIUM':
        return <AlertTriangle size={24} className="text-[var(--color-accent-warning)]" />;
      case 'STRICT':
        return <X size={24} className="text-[var(--color-accent-danger)]" />;
      default:
        return <Info size={24} className="text-[var(--color-accent-primary)]" />;
    }
  };

  const frase = FRASES_MOTIVACIONALES[Math.floor(Math.random() * FRASES_MOTIVACIONALES.length)];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-[var(--color-bg-card)] border border-white/10 rounded-[var(--radius-lg)] shadow-2xl shadow-black/50 w-96 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-card)]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[var(--color-text-primary)]">
                {notification.title}
              </h4>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {notification.body}
              </p>
              <p className="mt-2 text-xs text-[var(--color-accent-primary)] italic">
                "{frase}"
              </p>
            </div>
            <button
              onClick={closeNotification}
              className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {notification.modo === 'MEDIUM' && countdown > 0 && (
          <div className="h-1 bg-[var(--color-bg-secondary)]">
            <div
              className="h-full bg-[var(--color-accent-warning)] transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        )}

        {notification.modo === 'MEDIUM' && (
          <div className="px-4 py-3 bg-[var(--color-bg-secondary)] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">
              Cerrando en {countdown}s...
            </span>
            <button
              onClick={closeNotification}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--color-accent-primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-primary)]/90 transition-colors"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

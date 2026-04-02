import { Search, Bell, User } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export function Topbar() {
  const { estadoProteccion } = useAppStore();

  return (
    <header className="h-16 bg-[var(--color-bg-secondary)] border-b border-white/5 px-6 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          estadoProteccion.activa 
            ? 'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)]' 
            : 'bg-[var(--color-accent-danger)]/20 text-[var(--color-accent-danger)]'
        )}>
          {estadoProteccion.activa ? 'Protegido' : 'Desactivado'}
        </div>

        <button className="relative p-2 rounded-[var(--radius-md)] hover:bg-white/5 transition-colors">
          <Bell size={20} className="text-[var(--color-text-secondary)]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-accent-danger)] rounded-full" />
        </button>

        <button className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        </button>
      </div>
    </header>
  );
}

function clsx(...args: (string | undefined | null | false)[]): string {
  return args.filter(Boolean).join(' ');
}

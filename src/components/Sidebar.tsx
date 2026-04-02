import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  Clock, 
  Gamepad2, 
  History, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'horarios', label: 'Horarios', icon: Clock },
  { id: 'apps', label: 'Apps', icon: Gamepad2 },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'settings', label: 'Ajustes', icon: Settings },
] as const;

export function Sidebar() {
  const { sidebarCollapsed, paginaActual, setPaginaActual, setSidebarCollapsed } = useAppStore();

  return (
    <aside
      className={clsx(
        'h-screen bg-[var(--color-bg-secondary)] border-r border-white/5',
        'flex flex-col transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--color-accent-primary)]/30">
            <span className="text-white font-bold text-lg">CF</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-semibold text-[var(--color-text-primary)]">CuidaTuFocus</h1>
              <p className="text-xs text-[var(--color-text-muted)]">Mantén el foco</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = paginaActual === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setPaginaActual(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]',
                'transition-all duration-200',
                isActive 
                  ? 'bg-[var(--color-accent-primary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/30' 
                  : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon size={20} className={clsx(isActive && 'text-white')} />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-all duration-200"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!sidebarCollapsed && <span className="text-sm">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

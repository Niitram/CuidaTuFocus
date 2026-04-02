import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '../stores/appStore';
import { Dashboard, Horarios, Apps, Historial, Settings } from '../pages';

export function Layout() {
  const { paginaActual } = useAppStore();

  const renderPage = () => {
    switch (paginaActual) {
      case 'dashboard':
        return <Dashboard />;
      case 'horarios':
        return <Horarios />;
      case 'apps':
        return <Apps />;
      case 'historial':
        return <Historial />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

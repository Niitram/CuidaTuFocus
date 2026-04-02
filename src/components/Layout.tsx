import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationToast } from './NotificationToast';
import { useAppStore } from '../stores/appStore';
import { Dashboard, Horarios, Apps, Historial, Settings } from '../pages';

export function Layout() {
  const { paginaActual } = useAppStore();

  useEffect(() => {
    const handleClose = async () => {
      try {
        await invoke('minimize_to_tray');
      } catch (e) {
        console.error('Failed to minimize to tray:', e);
      }
    };

    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onCloseRequested(async (event) => {
      event.preventDefault();
      await handleClose();
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

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
      <NotificationToast />
    </div>
  );
}

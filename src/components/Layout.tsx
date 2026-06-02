import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <ShieldCheck size={18} className="text-blue-400" />
          <span className="text-sm font-bold tracking-tight">Vehicle Guard</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  ScrollText,
  LogOut,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const allNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { to: '/propostas', label: 'Propostas', icon: FileText, adminOnly: false },
  { to: '/vistorias', label: 'Vistorias', icon: ClipboardCheck, adminOnly: false },
  { to: '/termos', label: 'Termos Assinados', icon: ScrollText, adminOnly: false },
  { to: '/propostas-admin', label: 'Consulta Geral', icon: Search, adminOnly: true },
  { to: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
];

export default function Sidebar() {
  const { user, signOut, isAdmin } = useAuth();
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700 flex items-center gap-2">
        <ShieldCheck size={24} className="text-blue-400" />
        <span className="text-lg font-bold tracking-tight">Vehicle Guard</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold uppercase">
            {user?.nome?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}

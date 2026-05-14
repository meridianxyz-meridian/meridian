import { Outlet, NavLink } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import {
  LayoutDashboard, Upload, Clock, Share2,
  ShoppingCart, MessageCircle, Activity
} from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Records' },
  { to: '/timeline', icon: Clock, label: 'Health Timeline' },
  { to: '/share', icon: Share2, label: 'Share Access' },
  { to: '/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  { to: '/chat', icon: MessageCircle, label: 'AI Advocate' },
];

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass flex flex-col p-4 gap-2 shrink-0">
        <div className="flex items-center gap-2 px-2 py-4 mb-2">
          <Activity className="text-teal-400" size={24} />
          <span className="text-xl font-bold gradient-text">Meridian</span>
        </div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
               ${isActive
                 ? 'bg-teal-500/20 text-teal-400 font-medium'
                 : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <div className="mt-auto">
          <ConnectButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import {
  LayoutDashboard, Upload, Clock, Share2,
  ShoppingCart, MessageCircle, Activity, LogOut, Copy, CheckCircle
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/upload', icon: Upload, label: 'Upload Records' },
  { to: '/app/timeline', icon: Clock, label: 'Health Timeline' },
  { to: '/app/share', icon: Share2, label: 'Share Access' },
  { to: '/app/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  { to: '/app/chat', icon: MessageCircle, label: 'AI Advocate' },
];

export function Layout() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const copyAddress = () => {
    if (!account?.address) return;
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            end={to === '/app'}
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

        {/* Wallet info at bottom */}
        <div className="mt-auto space-y-2">
          {account && (
            <div className="glass rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Connected wallet</span>
                <button onClick={copyAddress} className="text-slate-600 hover:text-teal-400 transition-colors">
                  {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-400 truncate">
                {account.address.slice(0, 10)}...{account.address.slice(-8)}
              </p>
            </div>
          )}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

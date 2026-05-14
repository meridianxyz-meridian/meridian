import { useCurrentAccount } from '@mysten/dapp-kit';
import { Link } from 'react-router-dom';
import { Upload, Clock, Share2, ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { DEMO_PATIENT, DEMO_AI_RESULT } from '../data/demoData';

export function Dashboard() {
  const account = useCurrentAccount();

  const stats = [
    { label: 'Health Records', value: '21', icon: Shield, color: 'text-teal-400' },
    { label: 'Urgent Flags', value: '3', icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Drug Interactions', value: '3', icon: AlertTriangle, color: 'text-orange-400' },
    { label: 'Trial Earnings', value: '$800', icon: DollarSign, color: 'text-green-400' },
  ];

  const quickActions = [
    { to: '/upload', icon: Upload, label: 'Upload Records', desc: 'Add new medical records' },
    { to: '/timeline', icon: Clock, label: 'View Timeline', desc: 'Your full health history' },
    { to: '/share', icon: Share2, label: 'Share with Doctor', desc: 'Generate QR access code' },
    { to: '/marketplace', icon: ShoppingCart, label: 'Earn from Data', desc: 'Monetize anonymized data' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Welcome back, {DEMO_PATIENT.name.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1">
          {account ? `Connected: ${account.address.slice(0, 8)}...${account.address.slice(-6)}` : 'Connect your wallet to get started'}
        </p>
      </div>

      {/* Urgent flags banner */}
      {DEMO_AI_RESULT.urgentFlags.length > 0 && (
        <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-400" size={20} />
            <span className="font-semibold text-red-400">Urgent Health Flags</span>
          </div>
          <ul className="space-y-1.5">
            {DEMO_AI_RESULT.urgentFlags.map((flag, i) => (
              <li key={i} className="text-sm text-slate-300">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-5">
            <Icon className={color} size={22} />
            <div className="text-2xl font-bold mt-2">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-teal-400" size={20} />
          <span className="font-semibold">AI Health Summary</span>
        </div>
        <p className="text-slate-300 leading-relaxed">{DEMO_AI_RESULT.summary}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="glass rounded-xl p-5 hover:border-teal-500/40 transition-all group"
          >
            <Icon className="text-teal-400 group-hover:scale-110 transition-transform" size={24} />
            <div className="font-semibold mt-3">{label}</div>
            <div className="text-sm text-slate-400">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

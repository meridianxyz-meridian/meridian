import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Clock, Share2, ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Shield, User, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatientData } from '../hooks/usePatientData';

export function Dashboard() {
  const { address, isZkLogin } = useAuth();
  const zkEmail = sessionStorage.getItem('zklogin_email');
  const { records, analysis, name, setName, runAnalysis, hasData, loading } = usePatientData();
  const [analyzing, setAnalyzing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const displayName = name
    || (isZkLogin && zkEmail ? zkEmail.split('@')[0] : null)
    || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'User');

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await runAnalysis();
    setAnalyzing(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    await setName(nameInput);
    setEditingName(false);
  };

  const stats = [
    { label: 'Health Records', value: records.length.toString(), icon: Shield, color: 'text-teal-400' },
    { label: 'Urgent Flags', value: (analysis?.urgentFlags?.length ?? 0).toString(), icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Drug Interactions', value: (analysis?.interactions?.length ?? 0).toString(), icon: AlertTriangle, color: 'text-orange-400' },
    { label: 'Trial Matches', value: (analysis?.trialMatches?.length ?? 0).toString(), icon: DollarSign, color: 'text-green-400' },
  ];

  const quickActions = [
    { to: '/app/upload', icon: Upload, label: 'Upload Records', desc: 'Add new medical records' },
    { to: '/app/timeline', icon: Clock, label: 'View Timeline', desc: 'Your full health history' },
    { to: '/app/share', icon: Share2, label: 'Share with Doctor', desc: 'Generate QR access code' },
    { to: '/app/marketplace', icon: ShoppingCart, label: 'Earn from Data', desc: 'Monetize anonymized data' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-teal-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-800 border border-teal-500 rounded-lg px-3 py-1 text-lg font-bold focus:outline-none"
                />
                <button type="submit" className="px-3 py-1 bg-teal-500 rounded-lg text-sm">Save</button>
                <button type="button" onClick={() => setEditingName(false)} className="px-3 py-1 glass rounded-lg text-sm text-slate-400">Cancel</button>
              </form>
            ) : (
              <>
                <h1 className="text-3xl font-bold gradient-text">Welcome, {displayName}</h1>
                <button onClick={() => { setNameInput(name); setEditingName(true); }} className="text-slate-600 hover:text-teal-400 transition-colors">
                  <User size={16} />
                </button>
              </>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1 font-mono">{address}</p>
        </div>
        {hasData && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg text-sm hover:bg-teal-500/30 transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        )}
      </div>

      {/* Urgent flags */}
      {analysis?.urgentFlags && analysis.urgentFlags.length > 0 && (
        <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-400" size={20} />
            <span className="font-semibold text-red-400">Urgent Health Flags</span>
          </div>
          <ul className="space-y-1.5">
            {analysis.urgentFlags.map((flag, i) => (
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

      {/* Empty state */}
      {!hasData && (
        <div className="glass rounded-xl p-12 text-center border border-dashed border-slate-600">
          <Upload className="mx-auto text-slate-600 mb-4" size={40} />
          <h2 className="font-semibold text-lg mb-2">No health records yet</h2>
          <p className="text-slate-500 text-sm mb-6">Upload your medical records to get started. They'll be encrypted and stored on Walrus.</p>
          <Link to="/app/upload" className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-medium transition-colors">
            Upload Records
          </Link>
        </div>
      )}

      {/* AI Summary */}
      {analysis?.summary && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-teal-400" size={20} />
              <span className="font-semibold">AI Health Summary</span>
            </div>
            <span className="text-xs text-slate-600">{new Date(analysis.generatedAt).toLocaleDateString()}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="glass rounded-xl p-5 hover:border-teal-500/40 transition-all group">
            <Icon className="text-teal-400 group-hover:scale-110 transition-transform" size={24} />
            <div className="font-semibold mt-3">{label}</div>
            <div className="text-sm text-slate-400">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { DollarSign, FlaskConical, TrendingUp, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePatientData } from '../hooks/usePatientData';

const API = '';

interface Listing {
  id: string;
  studyId: string;
  status: 'active';
}

export function Marketplace() {
  const { address } = useAuth();
  const { analysis, hasData, runAnalysis } = usePatientData();
  const [listings, setListings] = useState<Listing[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);

  const trialMatches = analysis?.trialMatches ?? [];

  const totalEarnings = trialMatches.reduce((sum, t) => {
    const n = parseInt(t.compensation.replace(/\D/g, ''));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    await runAnalysis();
    setAnalyzing(false);
  };

  const enroll = async (trial: typeof trialMatches[0]) => {
    setEnrolling(trial.studyId);
    try {
      const res = await fetch(`${API}/api/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          anonymizedBlobId: `anon_blob_${trial.studyId}_${Date.now()}`,
          dataCategory: trial.studyId,
          priceMist: 450_000_000,
          studyId: trial.studyId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setListings(prev => [...prev, { id: data.id, studyId: trial.studyId, status: 'active' }]);
        setEnrolled(prev => new Set([...prev, trial.studyId]));
      }
    } finally {
      setEnrolling(null);
    }
  };

  // No records yet
  if (!hasData) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Data Marketplace</h1>
          <p className="text-slate-400 mt-1">Earn from anonymized research data contributions.</p>
        </div>
        <div className="glass rounded-xl p-12 text-center border border-dashed border-slate-600">
          <Upload className="mx-auto text-slate-600 mb-4" size={40} />
          <h2 className="font-semibold text-lg mb-2">No records to match</h2>
          <p className="text-slate-500 text-sm mb-6">
            Upload your medical records first, then run AI analysis to find clinical trials you qualify for.
          </p>
          <Link to="/app/upload" className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-medium transition-colors">
            Upload Records
          </Link>
        </div>
      </div>
    );
  }

  // Has records but no analysis yet
  if (!analysis) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Data Marketplace</h1>
          <p className="text-slate-400 mt-1">Earn from anonymized research data contributions.</p>
        </div>
        <div className="glass rounded-xl p-12 text-center border border-dashed border-slate-600">
          <FlaskConical className="mx-auto text-slate-600 mb-4" size={40} />
          <h2 className="font-semibold text-lg mb-2">Run AI analysis to find trials</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your AI health advocate will match your records to clinical trials you qualify for.
          </p>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mx-auto"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            {analyzing ? 'Analyzing your records...' : 'Run AI Analysis'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Data Marketplace</h1>
        <p className="text-slate-400 mt-1">
          Your anonymized health data is valuable. Earn from research studies — you set the price.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <DollarSign className="text-green-400" size={22} />
          <div className="text-2xl font-bold mt-2">${totalEarnings}</div>
          <div className="text-sm text-slate-400">Available to earn</div>
        </div>
        <div className="glass rounded-xl p-5">
          <FlaskConical className="text-blue-400" size={22} />
          <div className="text-2xl font-bold mt-2">{trialMatches.length}</div>
          <div className="text-sm text-slate-400">Matched trials</div>
        </div>
        <div className="glass rounded-xl p-5">
          <TrendingUp className="text-teal-400" size={22} />
          <div className="text-2xl font-bold mt-2">15%</div>
          <div className="text-sm text-slate-400">Platform fee</div>
        </div>
      </div>

      {/* No trials matched */}
      {trialMatches.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-4">No clinical trials matched your current records.</p>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg text-sm mx-auto disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {analyzing ? 'Re-analyzing...' : 'Re-run Analysis'}
          </button>
        </div>
      )}

      {/* Matched trials */}
      {trialMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Clinical Trials You Qualify For</h2>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-400 transition-colors disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {trialMatches.map(trial => (
              <div key={trial.studyId} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 font-mono">{trial.studyId}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        {trial.sponsor}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-200">{trial.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{trial.matchReason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-green-400">{trial.compensation}</div>
                    <div className="text-xs text-slate-500">compensation</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    You earn ~${Math.round(parseInt(trial.compensation.replace(/\D/g, '') || '0') * 0.85)} after 15% fee
                  </p>
                  {enrolled.has(trial.studyId) ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm">
                      <CheckCircle size={16} /> Enrolled
                    </div>
                  ) : (
                    <button
                      onClick={() => enroll(trial)}
                      disabled={enrolling === trial.studyId}
                      className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg text-sm hover:bg-teal-500/30 transition-colors disabled:opacity-50"
                    >
                      {enrolling === trial.studyId ? 'Enrolling...' : 'Enroll & List Data'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active listings */}
      {listings.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Your Active Listings</h2>
          <div className="space-y-2">
            {listings.map(l => (
              <div key={l.id} className="glass rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{l.studyId}</p>
                  <p className="text-xs text-slate-500 font-mono">{l.id}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

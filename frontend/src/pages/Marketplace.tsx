import { useState } from 'react';
import { DollarSign, FlaskConical, TrendingUp, CheckCircle } from 'lucide-react';
import { DEMO_AI_RESULT } from '../data/demoData';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Listing {
  id: string;
  dataCategory: string;
  priceMist: number;
  studyId: string;
  status: 'active' | 'sold';
}

export function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());

  const enroll = async (trial: typeof DEMO_AI_RESULT.trialMatches[0]) => {
    setEnrolling(trial.studyId);
    try {
      const res = await fetch(`${API}/api/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: '0x7f3a...b2c1',
          anonymizedBlobId: `anon_blob_${trial.studyId}`,
          dataCategory: trial.studyId,
          priceMist: 450_000_000, // 0.45 SUI
          studyId: trial.studyId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setListings(prev => [...prev, { ...data, status: 'active' }]);
        setEnrolled(prev => new Set([...prev, trial.studyId]));
      }
    } finally {
      setEnrolling(null);
    }
  };

  const totalEarnings = DEMO_AI_RESULT.trialMatches.reduce((sum, t) => {
    const n = parseInt(t.compensation.replace(/\D/g, ''));
    return sum + n;
  }, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Data Marketplace</h1>
        <p className="text-slate-400 mt-1">
          Your anonymized health data is valuable. Earn from research studies — you set the price.
        </p>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <DollarSign className="text-green-400" size={22} />
          <div className="text-2xl font-bold mt-2">${totalEarnings}</div>
          <div className="text-sm text-slate-400">Available to earn</div>
        </div>
        <div className="glass rounded-xl p-5">
          <FlaskConical className="text-blue-400" size={22} />
          <div className="text-2xl font-bold mt-2">{DEMO_AI_RESULT.trialMatches.length}</div>
          <div className="text-sm text-slate-400">Matched trials</div>
        </div>
        <div className="glass rounded-xl p-5">
          <TrendingUp className="text-teal-400" size={22} />
          <div className="text-2xl font-bold mt-2">15%</div>
          <div className="text-sm text-slate-400">Platform fee</div>
        </div>
      </div>

      {/* Matched trials */}
      <div>
        <h2 className="font-semibold mb-3">Clinical Trials You Qualify For</h2>
        <div className="space-y-3">
          {DEMO_AI_RESULT.trialMatches.map(trial => (
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
                  You earn {Math.round(parseInt(trial.compensation.replace(/\D/g, '')) * 0.85)} after 15% platform fee
                </p>
                {enrolled.has(trial.studyId) ? (
                  <div className="flex items-center gap-1.5 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    Enrolled
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

      {/* Active listings */}
      {listings.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Your Active Listings</h2>
          <div className="space-y-2">
            {listings.map(l => (
              <div key={l.id} className="glass rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{l.studyId}</p>
                  <p className="text-xs text-slate-500">{l.id}</p>
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

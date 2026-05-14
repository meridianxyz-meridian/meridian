import { useState } from 'react';
import { Clock, AlertTriangle, Pill, FlaskConical, Stethoscope, FileImage, Activity } from 'lucide-react';
import { DEMO_AI_RESULT, DEMO_RECORDS } from '../data/demoData';

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  lab:          { icon: FlaskConical, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  prescription: { icon: Pill,         color: 'text-purple-400', bg: 'bg-purple-500/10' },
  diagnosis:    { icon: Stethoscope,  color: 'text-orange-400', bg: 'bg-orange-500/10' },
  imaging:      { icon: FileImage,    color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  visit:        { icon: Activity,     color: 'text-teal-400',   bg: 'bg-teal-500/10' },
};

const significanceBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  notable:  'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  routine:  'bg-slate-700/50 text-slate-400',
};

export function Timeline() {
  const [filter, setFilter] = useState<string>('all');
  const types = ['all', 'lab', 'prescription', 'diagnosis', 'imaging', 'visit'];

  const records = DEMO_RECORDS
    .filter(r => filter === 'all' || r.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Health Timeline</h1>
        <p className="text-slate-400 mt-1">12 years of records synthesized by your AI health advocate</p>
      </div>

      {/* AI Summary */}
      <div className="glass rounded-xl p-5 border border-teal-500/20">
        <p className="text-slate-300 text-sm leading-relaxed">{DEMO_AI_RESULT.summary}</p>
      </div>

      {/* Interactions alert */}
      <div className="glass rounded-xl p-4 border border-orange-500/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="text-orange-400" size={18} />
          <span className="font-semibold text-orange-400 text-sm">
            {DEMO_AI_RESULT.interactions.length} Medication Interactions Detected
          </span>
        </div>
        <div className="space-y-2">
          {DEMO_AI_RESULT.interactions.map((ix, i) => (
            <div key={i} className="text-sm">
              <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 font-medium
                ${ix.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
                  ix.severity === 'moderate' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-yellow-500/20 text-yellow-400'}`}>
                {ix.severity}
              </span>
              <span className="text-slate-300">{ix.drug1} + {ix.drug2}</span>
              <p className="text-slate-500 text-xs mt-0.5 ml-14">{ix.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors
              ${filter === t ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-slate-200 glass'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative space-y-3">
        {records.map((record, i) => {
          const cfg = typeConfig[record.type] ?? typeConfig.visit;
          const Icon = cfg.icon;
          const sig = (record as any).significance ?? 'routine';

          return (
            <div key={i} className="flex gap-4">
              <div className={`shrink-0 w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                <Icon className={cfg.color} size={18} />
              </div>
              <div className="glass rounded-xl p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{record.content}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{record.source}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded ${significanceBadge[sig]}`}>
                      {sig}
                    </span>
                    <span className="text-xs text-slate-500">{record.date}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

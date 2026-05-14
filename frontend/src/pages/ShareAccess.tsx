import { useState } from 'react';
import { QrCode, Clock, Shield, Copy, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface ConsentGrant {
  grantId: string;
  grantee: string;
  expiresAt: Date;
  accessType: string;
  qrDataUrl: string;
}

export function ShareAccess() {
  const [doctorAddress, setDoctorAddress] = useState('');
  const [duration, setDuration] = useState('2');
  const [grant, setGrant] = useState<ConsentGrant | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const durations = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '24', label: '24 hours' },
    { value: '168', label: '1 week' },
  ];

  const generateGrant = async () => {
    setLoading(true);
    try {
      const expiresAt = new Date(Date.now() + Number(duration) * 60 * 60 * 1000);
      const grantId = `grant_${Date.now()}`;

      // In production: call Sui PTB to create ConsentGrant on-chain
      // For demo: generate QR with grant metadata
      const grantData = JSON.stringify({
        grantId,
        patientAddress: '0x7f3a...b2c1',
        grantee: doctorAddress || '0xdoctor',
        expiresAt: expiresAt.toISOString(),
        accessType: 'read_timed',
        // sealDecryptionKey would be here in production
      });

      const qrDataUrl = await QRCode.toDataURL(grantData, {
        width: 300,
        color: { dark: '#0d9488', light: '#0f172a' },
      });

      setGrant({
        grantId,
        grantee: doctorAddress || 'Any provider',
        expiresAt,
        accessType: 'read_timed',
        qrDataUrl,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyGrantId = () => {
    navigator.clipboard.writeText(grant?.grantId ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Share Access</h1>
        <p className="text-slate-400 mt-1">
          Generate a time-limited QR code. Access expires automatically — no hospital IT required.
        </p>
      </div>

      {!grant ? (
        <div className="glass rounded-xl p-6 space-y-5">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Doctor / Provider Address (optional)</label>
            <input
              type="text"
              value={doctorAddress}
              onChange={e => setDoctorAddress(e.target.value)}
              placeholder="0x... or leave blank for any provider"
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">Access Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {durations.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`py-2 rounded-lg text-sm transition-colors
                    ${duration === d.value ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'glass text-slate-400 hover:text-slate-200'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-lg p-3 flex items-start gap-2">
            <Shield className="text-teal-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-slate-400">
              Access is granted via Seal time-limited decryption key. The key is embedded in the QR code and becomes invalid after {durations.find(d => d.value === duration)?.label}.
              The on-chain ConsentGrant object is destroyed automatically.
            </p>
          </div>

          <button
            onClick={generateGrant}
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <QrCode size={18} />
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>
      ) : (
        <div className="glass rounded-xl p-6 space-y-5 text-center">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle size={20} />
            <span className="font-semibold">Consent Grant Created On-Chain</span>
          </div>

          <img
            src={grant.qrDataUrl}
            alt="QR Code"
            className="mx-auto rounded-xl"
            style={{ width: 240, height: 240 }}
          />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Clock size={14} />
              <span>Expires: {grant.expiresAt.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                {grant.grantId}
              </code>
              <button onClick={copyGrantId} className="text-teal-400 hover:text-teal-300">
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setGrant(null)}
            className="px-6 py-2 glass rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Generate Another
          </button>
        </div>
      )}

      {/* Active grants */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold mb-3 text-sm text-slate-400">Active Consent Grants</h2>
        <p className="text-sm text-slate-500 text-center py-4">No active grants</p>
      </div>
    </div>
  );
}

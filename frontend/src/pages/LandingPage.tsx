import { useNavigate } from 'react-router-dom';
import { Activity, Shield, Brain, DollarSign, Clock, Share2, ArrowRight, CheckCircle } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #0d2a2a 0%, #0f172a 60%)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Activity className="text-teal-400" size={24} />
          <span className="text-xl font-bold gradient-text">Meridian</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Launch App
        </button>
      </nav>

      {/* Hero */}
      <section className="text-center px-4 pt-20 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs text-teal-400 mb-6">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
          Live on Sui Testnet
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Your Medical Records,{' '}
          <span className="gradient-text">Finally Yours</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          The first patient-sovereign health system. Your records encrypted on Walrus, an AI advocate that works only for you, and you earn from your own data.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold transition-colors text-lg"
          >
            Get Started <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 glass rounded-xl font-semibold text-slate-300 hover:text-white transition-colors text-lg"
          >
            View Demo
          </button>
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-red-500/20 bg-red-500/5">
          <h2 className="text-2xl font-bold mb-6 text-center">The Problem</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
              { stat: '1 in 3', desc: 'Americans face serious medical errors due to incomplete records at point of care' },
              { stat: '$3,000', desc: 'Per patient record pharma companies pay — money that never reaches you' },
              { stat: '0%', desc: 'Of health data monetization value currently goes to the patient who generated it' },
            ].map(({ stat, desc }) => (
              <div key={stat}>
                <div className="text-4xl font-bold text-red-400 mb-2">{stat}</div>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need. Nothing they can touch.</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: Shield,
              title: 'Universal Health Vault',
              desc: 'All records encrypted with Seal threshold encryption before upload to Walrus. Only your key decrypts. Not even Meridian can read your data.',
              color: 'text-teal-400',
            },
            {
              icon: Brain,
              title: 'AI Health Advocate',
              desc: 'Persistent AI agent with your full longitudinal context. Detects medication interactions, flags lab trends, prepares visit briefings — all working for you.',
              color: 'text-purple-400',
            },
            {
              icon: Share2,
              title: 'Consent-Gated Sharing',
              desc: 'Share records with a QR code. Access expires automatically. No hospital IT department. No fax machine. One transaction on Sui.',
              color: 'text-blue-400',
            },
            {
              icon: DollarSign,
              title: 'Data Marketplace',
              desc: 'Earn from anonymized research data contributions. Clinical trials matched to your profile. You set the price. 85% goes directly to you.',
              color: 'text-green-400',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass rounded-xl p-6">
              <Icon className={`${color} mb-3`} size={28} />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo script */}
      <section className="px-4 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">See it in 90 seconds</h2>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Upload', desc: 'Drag 5 years of PDFs. Encrypted + on Walrus in 60 seconds.' },
            { step: '02', title: 'Synthesize', desc: 'AI synthesizes your health story. Flags 3 drug interactions you never knew about.' },
            { step: '03', title: 'Share', desc: 'New doctor scans QR code. Full record access. Expires in 2 hours automatically.' },
            { step: '04', title: 'Earn', desc: '2 clinical trials matched. $800 in potential earnings. One click to enroll.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-5 glass rounded-xl p-5">
              <div className="text-3xl font-bold text-teal-500/30 shrink-0 w-10">{step}</div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Built on the best infrastructure</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {['Sui Blockchain', 'Walrus Storage', 'Seal Encryption', 'zkLogin', 'Gemini AI', 'FHIR R4', 'DeepBook'].map(t => (
            <span key={t} className="glass px-4 py-2 rounded-full text-sm text-slate-300">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Your health history, finally working for you.</h2>
        <p className="text-slate-400 mb-8 text-lg">Join the waitlist or connect your wallet to start now.</p>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold transition-colors text-lg mx-auto"
        >
          Get Started Free <ArrowRight size={20} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-6 text-center text-slate-600 text-sm">
        © 2025 Meridian · Built on Sui · Patient-sovereign by design
      </footer>
    </div>
  );
}

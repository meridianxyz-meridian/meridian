import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Activity, Shield, Brain, DollarSign, Chrome } from 'lucide-react';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const REDIRECT_URI = window.location.origin + '/login';

export function LoginPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [zkLoading, setZkLoading] = useState(false);

  useEffect(() => {
    if (account) navigate('/app', { replace: true });
  }, [account, navigate]);

  // Handle zkLogin Google OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('id_token')) {
      // zkLogin callback — store token and redirect
      const params = new URLSearchParams(hash.slice(1));
      const idToken = params.get('id_token');
      if (idToken) {
        sessionStorage.setItem('zklogin_jwt', idToken);
        navigate('/app', { replace: true });
      }
    }
  }, [navigate]);

  const handleZkLoginGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('Add VITE_GOOGLE_CLIENT_ID to frontend/.env to enable zkLogin');
      return;
    }
    setZkLoading(true);
    try {
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      const { epoch } = await client.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;
      const randomness = generateRandomness();
      const nonce = generateNonce(
        // ephemeral keypair pubkey — in production generate a real keypair
        { toSuiBytes: () => new Uint8Array(32) } as any,
        maxEpoch,
        randomness
      );
      sessionStorage.setItem('zklogin_randomness', randomness.toString());
      sessionStorage.setItem('zklogin_max_epoch', maxEpoch.toString());

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce,
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch (err) {
      console.error('zkLogin error:', err);
      setZkLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, #0d2a2a 0%, #0f172a 60%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
          <Activity className="text-teal-400" size={28} />
        </div>
        <span className="text-3xl font-bold gradient-text">Meridian</span>
      </div>

      <h1 className="text-4xl font-bold text-center mb-3">
        Your health data, <span className="gradient-text">finally yours</span>
      </h1>
      <p className="text-slate-400 text-center max-w-md mb-10">
        Connect your wallet or sign in with Google via zkLogin — no seed phrase needed.
      </p>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl w-full">
        {[
          { icon: Shield, label: 'Encrypted on Walrus', desc: 'Only you can decrypt' },
          { icon: Brain, label: 'AI Health Advocate', desc: 'Powered by Gemini' },
          { icon: DollarSign, label: 'Earn from your data', desc: 'Clinical trial matching' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <Icon className="text-teal-400 mx-auto mb-2" size={22} />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Auth options */}
      <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h2 className="font-semibold text-lg text-center mb-2">Sign in to Meridian</h2>

        {/* zkLogin Google */}
        <button
          onClick={handleZkLoginGoogle}
          disabled={zkLoading}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <Chrome size={20} className="text-blue-500" />
          {zkLoading ? 'Redirecting...' : 'Continue with Google (zkLogin)'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500">or use wallet</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Wallet connect */}
        <div className="flex justify-center">
          <ConnectButton connectText="Connect Sui Wallet" />
        </div>

        {!GOOGLE_CLIENT_ID && (
          <p className="text-xs text-slate-600 text-center">
            Add <code className="text-teal-600">VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in
          </p>
        )}

        <p className="text-xs text-slate-600 text-center">
          By connecting, you own your data. Meridian never holds your keys.
        </p>
      </div>
    </div>
  );
}

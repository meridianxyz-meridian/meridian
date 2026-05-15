import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Activity, Shield, Brain, DollarSign, Chrome, Loader2 } from 'lucide-react';
import { generateNonce, generateRandomness, jwtToAddress } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const REDIRECT_URI = window.location.origin + '/login';

export function LoginPage() {
  const walletAccount = useCurrentAccount();
  const navigate = useNavigate();
  const [zkLoading, setZkLoading] = useState(false);
  const [processingCallback, setProcessingCallback] = useState(false);
  const [error, setError] = useState('');

  // Wallet connected → go to app
  useEffect(() => {
    if (walletAccount) navigate('/app', { replace: true });
  }, [walletAccount, navigate]);

  // Handle Google OAuth callback — fires when Google redirects back with #id_token=...
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('id_token')) return;

    setProcessingCallback(true);
    const params = new URLSearchParams(hash.slice(1));
    const idToken = params.get('id_token');

    if (!idToken) {
      setError('No token received from Google');
      setProcessingCallback(false);
      return;
    }

    try {
      // Decode JWT to get the sub (user ID) for address derivation
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const sub: string = payload.sub;

      // Derive deterministic Sui address from sub + salt 0
      // In production use a unique per-user salt from a salt service
      const address = jwtToAddress(idToken, BigInt(0));

      // Persist
      sessionStorage.setItem('zklogin_jwt', idToken);
      sessionStorage.setItem('zklogin_address', address);
      sessionStorage.setItem('zklogin_sub', sub);
      sessionStorage.setItem('zklogin_email', payload.email ?? '');

      // Clean URL then redirect to dashboard
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/app', { replace: true });
    } catch (err: any) {
      console.error('zkLogin address derivation failed:', err);
      setError('Sign-in failed: ' + err.message);
      setProcessingCallback(false);
    }
  }, [navigate]);

  const handleZkLoginGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('VITE_GOOGLE_CLIENT_ID not set. See console for setup instructions.');
      console.info(
        'zkLogin setup:\n' +
        '1. Go to https://console.cloud.google.com/apis/credentials\n' +
        '2. Create OAuth 2.0 Client ID → Web application\n' +
        '3. Authorized redirect URI: ' + REDIRECT_URI + '\n' +
        '4. Add VITE_GOOGLE_CLIENT_ID=<id> to frontend/.env\n' +
        '5. Restart frontend (npm run dev)'
      );
      return;
    }

    setZkLoading(true);
    setError('');
    try {
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      const { epoch } = await client.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;

      const ephemeralKeypair = new Ed25519Keypair();
      const randomness = generateRandomness();
      const nonce = generateNonce(ephemeralKeypair.getPublicKey(), maxEpoch, randomness);

      sessionStorage.setItem('zklogin_randomness', randomness.toString());
      sessionStorage.setItem('zklogin_max_epoch', maxEpoch.toString());

      const oauthParams = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce,
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${oauthParams}`;
    } catch (err: any) {
      setError('Failed to start sign-in: ' + err.message);
      setZkLoading(false);
    }
  };

  if (processingCallback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'radial-gradient(ellipse at top, #0d2a2a 0%, #0f172a 60%)' }}>
        <Loader2 className="animate-spin text-teal-400 mb-4" size={40} />
        <p className="text-slate-400">Signing you in with Google...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, #0d2a2a 0%, #0f172a 60%)' }}>
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
        Sign in with Google via zkLogin — no wallet or seed phrase needed.
      </p>

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

      <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h2 className="font-semibold text-lg text-center">Sign in to Meridian</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleZkLoginGoogle}
          disabled={zkLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          {zkLoading
            ? <Loader2 size={18} className="animate-spin text-slate-600" />
            : <Chrome size={18} className="text-blue-500" />}
          {zkLoading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        <p className="text-xs text-center text-slate-500">
          Powered by Sui zkLogin — your Google account creates a Sui address. No wallet needed.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <div className="flex justify-center">
          <ConnectButton connectText="Connect Sui Wallet" />
        </div>

        <p className="text-xs text-slate-600 text-center">
          By signing in, you own your data. Meridian never holds your keys.
        </p>
      </div>
    </div>
  );
}

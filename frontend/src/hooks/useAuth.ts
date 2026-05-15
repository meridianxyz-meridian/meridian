import { useCurrentAccount } from '@mysten/dapp-kit';

export function useAuth() {
  const walletAccount = useCurrentAccount();

  // zkLogin stores the derived address directly after Google callback
  const zkAddress = sessionStorage.getItem('zklogin_address');
  const zkJwt = sessionStorage.getItem('zklogin_jwt');

  const address = walletAccount?.address ?? (zkJwt ? zkAddress : null);

  return {
    isConnected: !!address,
    address,
    isZkLogin: !walletAccount && !!zkJwt,
  };
}

export function clearZkLogin() {
  sessionStorage.removeItem('zklogin_jwt');
  sessionStorage.removeItem('zklogin_address');
  sessionStorage.removeItem('zklogin_randomness');
  sessionStorage.removeItem('zklogin_max_epoch');
  sessionStorage.removeItem('zklogin_ephemeral_key');
}

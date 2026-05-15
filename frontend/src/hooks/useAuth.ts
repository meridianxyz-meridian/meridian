import { useCurrentAccount } from '@mysten/dapp-kit';

export function useAuth() {
  const account = useCurrentAccount();
  const zkJwt = sessionStorage.getItem('zklogin_jwt');
  return {
    isConnected: !!account || !!zkJwt,
    address: account?.address ?? null,
    isZkLogin: !!zkJwt,
  };
}

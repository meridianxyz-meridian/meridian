import { useCurrentAccount } from '@mysten/dapp-kit';

export function useAuth() {
  const account = useCurrentAccount();
  return {
    isConnected: !!account,
    address: account?.address ?? null,
  };
}

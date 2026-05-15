import { useCurrentAccount } from "@mysten/dapp-kit";

function getZkAddress(): string | null {
  const jwt = sessionStorage.getItem("zklogin_jwt");
  if (!jwt) return null;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    // Use sub (Google user ID) as a stable address key
    return `zklogin_${payload.sub}`;
  } catch {
    return null;
  }
}

export function useAuth() {
  const account = useCurrentAccount();
  const zkAddress = getZkAddress();
  return {
    isConnected: !!account || !!zkAddress,
    address: account?.address ?? zkAddress,
    isZkLogin: !!zkAddress,
  };
}

export function clearZkLogin() {
  sessionStorage.removeItem("zklogin_jwt");
  sessionStorage.removeItem("zklogin_address");
  sessionStorage.removeItem("zklogin_randomness");
  sessionStorage.removeItem("zklogin_max_epoch");
  sessionStorage.removeItem("zklogin_ephemeral_key");
}

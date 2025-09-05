import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

// Base Account paymaster service URL (from the documentation example)
const PAYMASTER_SERVICE_URL = 'https://api.developer.coinbase.com/rpc/v1/base/v7HqDLjJY4e28qgIDAAN4JNYXnz88mJZ';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(), // For Base App's automatically injected provider
    metaMask(),
    coinbaseWallet({
      appName: 'Defeat the Dragon',
      appLogoUrl: 'https://dtd.rchetype.xyz/icon.png',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

// Base Account capability detection
export async function getBaseAccountCapabilities(address: string) {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  try {
    const capabilities = await window.ethereum.request({
      method: 'wallet_getCapabilities',
      params: [address],
    });

    // Extract Base Account capabilities (chain ID 0x2105 = 8453 for Base)
    const baseCapabilities = capabilities['0x2105'];
    
    return {
      atomicBatch: baseCapabilities?.atomicBatch?.supported || false,
      paymasterService: baseCapabilities?.paymasterService?.supported || false,
      auxiliaryFunds: baseCapabilities?.auxiliaryFunds?.supported || false,
    };
  } catch (error) {
    console.warn('Failed to get wallet capabilities:', error);
    return null;
  }
}

// Get capabilities for sponsored transactions
export function getCapabilitiesForSponsoredTransaction(availableCapabilities: any, chainId: number) {
  if (!availableCapabilities || chainId !== base.id) {
    return {};
  }

  const capabilitiesForChain = availableCapabilities[chainId];
  
  if (
    capabilitiesForChain?.['paymasterService'] &&
    capabilitiesForChain['paymasterService'].supported
  ) {
    return {
      paymasterService: {
        url: PAYMASTER_SERVICE_URL,
      },
    };
  }
  
  return {};
}

// Check if wallet supports atomic batch transactions
export function supportsAtomicBatch(availableCapabilities: any, chainId: number) {
  if (!availableCapabilities || chainId !== base.id) {
    return false;
  }

  const capabilitiesForChain = availableCapabilities[chainId];
  return capabilitiesForChain?.['atomicBatch']?.supported || false;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

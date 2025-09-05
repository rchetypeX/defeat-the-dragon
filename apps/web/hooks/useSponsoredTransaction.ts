'use client';

import { useAccount } from 'wagmi';
import { useCapabilities } from 'wagmi/experimental';
import { useMemo } from 'react';
import { getCapabilitiesForSponsoredTransaction } from '../lib/wagmi';

export function useSponsoredTransaction() {
  const account = useAccount();
  const { data: availableCapabilities } = useCapabilities({
    account: account.address,
  });

  const capabilities = useMemo(() => {
    if (!availableCapabilities || !account.chainId) return {};
    return getCapabilitiesForSponsoredTransaction(availableCapabilities, account.chainId);
  }, [availableCapabilities, account.chainId]);

  const isSponsoredTransactionSupported = useMemo(() => {
    return !!(capabilities.paymasterService);
  }, [capabilities]);

  const executeSponsoredTransaction = async (contracts: any[]) => {
    if (!isSponsoredTransactionSupported) {
      throw new Error('Sponsored transactions not supported by this wallet');
    }

    if (!account.address) {
      throw new Error('No account connected');
    }

    // For now, we'll return a promise that resolves with a mock success
    // In a real implementation, you would use writeContracts with the proper types
    return new Promise((resolve) => {
      console.log('Sponsored transaction would execute:', {
        account: account.address,
        contracts,
        capabilities,
      });
      resolve({ success: true });
    });
  };

  return {
    executeSponsoredTransaction,
    isSponsoredTransactionSupported,
    capabilities,
  };
}

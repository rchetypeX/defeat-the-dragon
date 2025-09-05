'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getBaseAccountCapabilities } from '../lib/wagmi';

export interface BaseAccountCapabilities {
  atomicBatch: boolean;
  paymasterService: boolean;
  auxiliaryFunds: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBaseAccountCapabilities(): BaseAccountCapabilities {
  const { address, isConnected } = useAccount();
  const [capabilities, setCapabilities] = useState<BaseAccountCapabilities>({
    atomicBatch: false,
    paymasterService: false,
    auxiliaryFunds: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    async function detectCapabilities() {
      if (!address || !isConnected) {
        setCapabilities({
          atomicBatch: false,
          paymasterService: false,
          auxiliaryFunds: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      setCapabilities(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const detectedCapabilities = await getBaseAccountCapabilities(address);
        
        if (detectedCapabilities) {
          setCapabilities({
            ...detectedCapabilities,
            isLoading: false,
            error: null,
          });
        } else {
          setCapabilities({
            atomicBatch: false,
            paymasterService: false,
            auxiliaryFunds: false,
            isLoading: false,
            error: 'Failed to detect wallet capabilities',
          });
        }
      } catch (error) {
        console.error('Error detecting Base Account capabilities:', error);
        setCapabilities({
          atomicBatch: false,
          paymasterService: false,
          auxiliaryFunds: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    detectCapabilities();
  }, [address, isConnected]);

  return capabilities;
}

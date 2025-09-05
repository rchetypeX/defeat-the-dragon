'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  transferUSDC, 
  checkUSDCBalance, 
  waitForUSDCTransaction, 
  formatUSDC,
  USDC_CONTRACT_ADDRESS 
} from '../../lib/usdcPayment';

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MERCHANT_WALLET = process.env.NEXT_PUBLIC_MERCHANT_WALLET || '0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9'; // Set NEXT_PUBLIC_MERCHANT_WALLET in your .env.local

interface SubscriptionPricing {
  id: string;
  subscription_type: string;
  price_usd: number;
  price_usdc: number;
  duration_days: number;
  description: string;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function SubscriptionPopup({ isOpen, onClose, onSuccess }: SubscriptionPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual' | 'donate'>('monthly');
  const [donateAmount, setDonateAmount] = useState<number | ''>(1);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Record<string, SubscriptionPricing>>({});
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // Load subscription pricing from API
  const loadPricing = async () => {
    try {
      setIsLoadingPricing(true);
      const response = await fetch('/api/master/subscription-pricing');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPricing(result.data);
        }
      } else {
        console.error('Failed to load subscription pricing');
        setError('Failed to load subscription pricing');
      }
    } catch (error) {
      console.error('Error loading subscription pricing:', error);
      setError('Error loading subscription pricing');
    } finally {
      setIsLoadingPricing(false);
    }
  };

  // Check wallet connection
  const checkWalletConnection = async () => {
    // First check if user is authenticated with a wallet address
    if (user?.user_metadata?.wallet_address) {
      setIsWalletConnected(true);
      setWalletAddress(user.user_metadata.wallet_address);
      
      // Check USDC balance for the authenticated wallet
      try {
        const balanceCheck = await checkUSDCBalance(user.user_metadata.wallet_address, 0);
        setUsdcBalance(balanceCheck.currentBalance);
      } catch (error) {
        console.error('Error checking USDC balance:', error);
        setUsdcBalance(null);
      }
      return;
    }
    
    // Fallback to checking window.ethereum for web wallet connections
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setWalletAddress(accounts[0]);
          
          // Check USDC balance
          try {
            const balanceCheck = await checkUSDCBalance(accounts[0], 0);
            setUsdcBalance(balanceCheck.currentBalance);
          } catch (error) {
            console.error('Error checking USDC balance:', error);
            setUsdcBalance(null);
          }
        } else {
          setIsWalletConnected(false);
          setWalletAddress(null);
          setUsdcBalance(null);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setIsWalletConnected(false);
        setWalletAddress(null);
        setUsdcBalance(null);
      }
    } else {
      setIsWalletConnected(false);
      setWalletAddress(null);
      setUsdcBalance(null);
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    // If user is already authenticated with a wallet, no need to connect
    if (user?.user_metadata?.wallet_address) {
      setIsWalletConnected(true);
      setWalletAddress(user.user_metadata.wallet_address);
      return;
    }
    
    if (!window.ethereum) {
      setError('MetaMask or another Web3 wallet is required. Please install MetaMask.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setIsWalletConnected(true);
        setWalletAddress(accounts[0]);
        
        // Try to switch to Base Network after connecting
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // Base Mainnet
          });
        } catch (switchError: any) {
          // If Base Network is not added, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                }],
              });
            } catch (addError) {
              console.error('Failed to add Base network:', addError);
              setError('Failed to add Base network. Please add it manually.');
            }
          } else {
            console.error('Failed to switch to Base network:', switchError);
            setError('Please switch to Base network manually.');
          }
        }
      } else {
        setError('No wallet account found. Please make sure your wallet is unlocked.');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        setError('Wallet connection was rejected. Please try again.');
      } else if (error.code === -32002) {
        setError('Wallet connection request is already pending. Please check your wallet.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPricing();
      checkWalletConnection();
    }
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setWalletAddress(accounts[0]);
        } else {
          setIsWalletConnected(false);
          setWalletAddress(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setTransactionHash(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubscribe = async () => {
    if (!isWalletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask or another Web3 wallet is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the already connected wallet address
      const account = walletAddress;
      if (!account) {
        setError('No wallet address found. Please connect your wallet.');
        return;
      }

      // Switch to Base Network (Chain ID 8453)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base Mainnet
        });
      } catch (switchError: any) {
        // If Base Network is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        } else {
          throw switchError;
        }
      }

      // Get pricing from the loaded data or use donate amount
      let priceUsdc: number;
      let durationDays: number;
      
      if (subscriptionType === 'donate') {
        if (donateAmount === '' || donateAmount < 1) {
          setError('Please enter a valid USDC amount (minimum 1)');
          return;
        }
        priceUsdc = donateAmount;
        durationDays = donateAmount; // 1 USDC = 1 Day
      } else {
        const currentPricing = pricing[subscriptionType];
        if (!currentPricing) {
          setError('Pricing not available. Please try again.');
          return;
        }
        priceUsdc = currentPricing.price_usdc;
        durationDays = currentPricing.duration_days;
      }

      // Check USDC balance
      const balanceCheck = await checkUSDCBalance(account, priceUsdc);
      if (!balanceCheck.hasBalance) {
        setError(`Insufficient USDC balance. You have ${formatUSDC(balanceCheck.currentBalance)} but need ${formatUSDC(balanceCheck.requiredAmount)}.`);
        return;
      }

      // Transfer USDC
      const txHash = await transferUSDC({
        to: MERCHANT_WALLET,
        amount: priceUsdc,
        from: account,
      });

      setTransactionHash(txHash);

      // Wait for transaction confirmation
      const receipt = await waitForUSDCTransaction(txHash);
      
      if (receipt.status === '0x1') {
        // Transaction successful, update user subscription in Supabase
        await updateUserSubscription(txHash);
        onSuccess?.();
        // Don't call onClose() here - let the parent component handle it
        // This prevents the navigation issue where it goes back to home instead of shop
      } else {
        setError('Transaction failed');
      }

    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to process subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSubscription = async (txHash: string) => {
    try {
      let durationDays: number;
      let subscriptionTypeForAPI: string;
      
      if (subscriptionType === 'donate') {
        if (donateAmount === '' || donateAmount < 1) {
          throw new Error('Invalid donate amount');
        }
        durationDays = donateAmount;
        subscriptionTypeForAPI = 'donate';
      } else {
        const currentPricing = pricing[subscriptionType];
        if (!currentPricing) {
          throw new Error('Pricing not available');
        }
        durationDays = currentPricing.duration_days;
        subscriptionTypeForAPI = subscriptionType;
      }

      // Get auth token for the request
      let token: string | null = null;
      
      // Check if we have a wallet user in localStorage
      const walletUserStr = localStorage.getItem('walletUser');
      if (walletUserStr) {
        try {
          const walletUser = JSON.parse(walletUserStr);
          token = `wallet:${JSON.stringify(walletUser)}`;
        } catch (e) {
          console.error('Error parsing wallet user:', e);
        }
      }
      
      // Check if we have a Base App user in localStorage
      if (!token) {
        const baseAppUserStr = localStorage.getItem('baseAppUser');
        if (baseAppUserStr) {
          try {
            const baseAppUser = JSON.parse(baseAppUserStr);
            token = `baseapp:${JSON.stringify(baseAppUser)}`;
          } catch (e) {
            console.error('Error parsing Base App user:', e);
          }
        }
      }
      
      // If no wallet or Base App token, try to get Supabase session
      if (!token) {
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        // For Supabase tokens, use 'Bearer' prefix
        if (!token.startsWith('wallet:') && !token.startsWith('baseapp:')) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          // For wallet and Base App tokens, use the custom format
          headers['Authorization'] = token;
        }
      }

      // Use the actual subscription type from the pricing, not hardcoded
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subscriptionType: subscriptionTypeForAPI, // Use the actual selected type: 'monthly', 'annual', or 'donate'
          duration: durationDays,
          transactionHash: txHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Subscription API error:', errorData);
        throw new Error(`Failed to update subscription status: ${errorData.error || 'Unknown error'}`);
      }

      console.log('Subscription updated successfully');
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
      <div ref={modalRef} className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-4 sm:p-6 w-full max-w-md pixel-art max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">✨</div>
          <h2 className="text-xl font-bold text-[#8B4513] mb-2">Inspiration Boon</h2>
          <p className="text-[#654321] text-sm">
            Unlock Sparks rewards from your focus sessions!
          </p>
        </div>

        {/* Wallet Connection Status */}
        {!isWalletConnected ? (
          <div className="text-center mb-6">
            <div className="bg-[#1a1a2e] border-2 border-[#8B4513] rounded-lg p-4 mb-4">
              <div className="text-[#fbbf24] text-lg mb-2">🔗</div>
              <h3 className="text-[#f2751a] font-bold mb-2">Wallet Required</h3>
              <p className="text-[#fbbf24] text-sm mb-4">
                To subscribe to the Inspiration Boon, you need to connect your Web3 wallet.
              </p>
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="w-full pixel-button bg-[#f2751a] hover:bg-[#e65a0a] text-white px-4 py-2 font-bold disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Connected Wallet Info */}
            <div className="bg-[#1a1a2e] border-2 border-[#8B4513] rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#fbbf24] text-sm font-medium">Connected Wallet:</span>
                <span className="text-white text-xs font-mono">
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#fbbf24] text-sm font-medium">USDC Balance:</span>
                {usdcBalance !== null ? (
                  <span className="text-white text-xs font-mono">
                    {formatUSDC(usdcBalance)}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">
                    Checking...
                  </span>
                )}
              </div>
              {usdcBalance === null && (
                <div className="mt-2 text-center">
                  <button
                    onClick={() => checkWalletConnection()}
                    className="text-xs text-[#fbbf24] hover:text-white underline"
                    title="Retry USDC balance check"
                  >
                    🔄 Retry Balance Check
                  </button>
                </div>
              )}
            </div>

        {/* Subscription Type Toggle */}
        <div className="flex bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-1 mb-4">
          <button
            onClick={() => setSubscriptionType('monthly')}
            className={`flex-1 py-2 px-1 sm:px-2 rounded text-xs font-medium transition-colors ${
              subscriptionType === 'monthly'
                ? 'bg-[#f2751a] text-white'
                : 'text-[#fbbf24] hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Monthly</span>
            <span className="sm:hidden">Monthly</span>
          </button>
          <button
            onClick={() => setSubscriptionType('annual')}
            className={`flex-1 py-2 px-1 sm:px-2 rounded text-xs font-medium transition-colors ${
              subscriptionType === 'annual'
                ? 'bg-[#f2751a] text-white'
                : 'text-[#fbbf24] hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Annual</span>
            <span className="sm:hidden">Annual</span>
          </button>
          <button
            onClick={() => setSubscriptionType('donate')}
            className={`flex-1 py-2 px-1 sm:px-2 rounded text-xs font-medium transition-colors ${
              subscriptionType === 'donate'
                ? 'bg-[#f2751a] text-white'
                : 'text-[#fbbf24] hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Donate</span>
            <span className="sm:hidden">Donate</span>
          </button>
        </div>

        {/* Loading Pricing */}
        {isLoadingPricing && (
          <div className="bg-[#e8e8d0] border-2 border-[#8B4513] rounded-lg p-4 mb-6">
            <div className="text-center text-[#8B4513]">
              Loading pricing...
            </div>
          </div>
        )}

        {/* Subscription Details */}
        {!isLoadingPricing && (subscriptionType === 'donate' || pricing[subscriptionType]) && (
          <>
            {subscriptionType === 'donate' ? (
              /* Donate Option */
              <div className="bg-[#e8e8d0] border-2 border-[#8B4513] rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8B4513] font-bold">Duration:</span>
                    <span className="text-[#654321]">
                      {donateAmount === '' ? 'Enter amount' : `${donateAmount} Day${donateAmount !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B4513] font-bold">Price:</span>
                    <span className="text-[#654321] font-bold">
                      {donateAmount === '' ? 'Enter amount' : `${formatUSDC(donateAmount)} USDC`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B4513] font-bold">Network:</span>
                    <span className="text-[#654321]">Base</span>
                  </div>
                  <div className="bg-[#fbbf24] text-[#8B4513] p-2 rounded text-xs text-center font-bold break-words">
                    💝 Custom donation amount<br className="sm:hidden" />
                    <span className="hidden sm:inline"> - </span>1 USDC = 1 Day of Inspiration
                  </div>
                </div>
              </div>
            ) : (
              /* Monthly/Annual Options */
              <div className="bg-[#e8e8d0] border-2 border-[#8B4513] rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8B4513] font-bold">Duration:</span>
                    <span className="text-[#654321]">
                      {pricing[subscriptionType].duration_days} Days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B4513] font-bold">Price:</span>
                    <span className="text-[#654321] font-bold">
                      {formatUSDC(pricing[subscriptionType].price_usdc)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B4513] font-bold">Network:</span>
                    <span className="text-[#654321]">Base</span>
                  </div>
                  {subscriptionType === 'annual' && (
                    <div className="bg-[#10b981] text-white p-2 rounded text-xs text-center font-bold">
                      🎉 2 months FREE! Save with annual subscription
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Donate Amount Input */}
            {subscriptionType === 'donate' && (
              <div className="bg-[#e8e8d0] border-2 border-[#8B4513] rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[#8B4513] font-bold text-sm mb-2 break-words">
                      <span className="hidden sm:inline">USDC Amount (Whole numbers only):</span>
                      <span className="sm:hidden">USDC Amount:</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={donateAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setDonateAmount('');
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1) {
                            setDonateAmount(numValue);
                          }
                        }
                      }}
                      className="w-full pixel-input bg-[#f5f5dc] border-2 border-[#8B4513] rounded text-[#8B4513] px-3 py-2 font-mono text-center"
                      placeholder="Enter USDC amount"
                    />
                  </div>
                  <div className="text-center text-xs text-[#654321] break-words">
                    💡 Minimum: 1 USDC = 1 Day of Inspiration
                  </div>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="text-[#8B4513] font-bold mb-3">✨ What you get:</h3>
              <ul className="space-y-2 text-sm text-[#654321]">
                {subscriptionType === 'donate' ? (
                  <>
                    <li>• Support to keep the Game Ad-free</li>
                    <li>• Earn Sparks from successful focus sessions</li>
                    <li>• Access to exclusive shop items</li>
                    <li>• {donateAmount === '' ? 'Enter amount for' : `${donateAmount} Day${donateAmount !== 1 ? 's' : ''} of`} Inspiration Boon</li>
                  </>
                ) : (
                  pricing[subscriptionType]?.benefits.map((benefit, index) => (
                    <li key={index}>• {benefit}</li>
                  ))
                )}
              </ul>
            </div>

            {/* Last Updated Timestamp */}
            {subscriptionType !== 'donate' && (
              <div className="mb-4 text-center">
                <p className="text-xs text-[#654321] opacity-75">
                  Last updated: {pricing[subscriptionType]?.updated_at ? 
                    new Date(pricing[subscriptionType].updated_at).toLocaleString() : 
                    'Unknown'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            <div className="font-bold">Transaction submitted!</div>
            <div className="text-xs break-all">
              Hash: {transactionHash}
            </div>
            <div className="text-xs mt-1">
              <button
                onClick={() => {
                  try {
                    // Use proper external navigation following Base App guidelines
                    if (typeof window !== 'undefined') {
                      window.open(`https://basescan.org/tx/${transactionHash}`, '_blank', 'noopener,noreferrer');
                    }
                  } catch (error) {
                    console.error('Failed to open transaction link:', error);
                  }
                }}
                className="underline hover:no-underline cursor-pointer"
              >
                View on BaseScan →
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-3 font-bold disabled:opacity-50 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            disabled={isLoading || (subscriptionType === 'donate' && (donateAmount === '' || donateAmount < 1))}
            className="flex-1 pixel-button bg-[#8B4513] hover:bg-[#654321] text-white px-4 py-3 font-bold disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? 'Processing...' : 'SUBSCRIBE'}
          </button>
        </div>

        {/* Network Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#654321]">
            Make sure you're connected to Base Network and have USDC
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

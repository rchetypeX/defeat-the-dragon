// USDC Payment Handler for Base Network
// Based on the USDC payments app documentation

// USDC Contract Address on Base Network
export const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC Contract ABI (minimal for transfer function)
export const USDC_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// USDC has 6 decimals (unlike ETH which has 18)
export const USDC_DECIMALS = 6;

export interface USDCTransferParams {
  to: string;
  amount: number; // Amount in USDC (e.g., 5.50 for $5.50)
  from: string;
}

export interface USDCBalance {
  balance: number;
  symbol: string;
  decimals: number;
}

/**
 * Convert USDC amount to the smallest unit (like wei for ETH)
 */
export function usdcToSmallestUnit(amount: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
}

/**
 * Convert smallest unit back to USDC amount
 */
export function smallestUnitToUsdc(amount: bigint): number {
  return Number(amount) / Math.pow(10, USDC_DECIMALS);
}

/**
 * Check if user has sufficient USDC balance
 */
export async function checkUSDCBalance(
  userAddress: string,
  requiredAmount: number
): Promise<{ hasBalance: boolean; currentBalance: number; requiredAmount: number }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not available');
  }

  try {
    // Create contract instance for balance check
    const balanceData = await window.ethereum.request({
      method: 'eth_call',
      params: [
        {
          to: USDC_CONTRACT_ADDRESS,
          data: '0x70a08231' + '000000000000000000000000' + userAddress.slice(2), // balanceOf(address)
        },
        'latest'
      ]
    });

    const currentBalance = smallestUnitToUsdc(BigInt(balanceData));
    const hasBalance = currentBalance >= requiredAmount;

    return {
      hasBalance,
      currentBalance,
      requiredAmount
    };
  } catch (error) {
    console.error('Error checking USDC balance:', error);
    throw new Error('Failed to check USDC balance');
  }
}

/**
 * Transfer USDC tokens
 */
export async function transferUSDC(params: USDCTransferParams): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not available');
  }

  try {
    const { to, amount, from } = params;
    
    // Convert amount to smallest unit
    const amountInSmallestUnit = usdcToSmallestUnit(amount);
    
    // Create transfer function data
    const transferData = '0xa9059cbb' + // transfer(address,uint256) function signature
      '000000000000000000000000' + to.slice(2) + // recipient address (padded)
      amountInSmallestUnit.toString(16).padStart(64, '0'); // amount (padded)

    // Get current gas price
    const gasPrice = await window.ethereum.request({
      method: 'eth_gasPrice',
    });

    // Estimate gas for the transaction
    const gasEstimate = await window.ethereum.request({
      method: 'eth_estimateGas',
      params: [{
        from: from,
        to: USDC_CONTRACT_ADDRESS,
        data: transferData,
      }],
    });

    // Send transaction
    const transactionParameters = {
      to: USDC_CONTRACT_ADDRESS,
      from: from,
      data: transferData,
      gas: '0x' + Math.floor(Number(gasEstimate) * 1.1).toString(16), // Add 10% buffer
      gasPrice: gasPrice,
    };

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });

    return txHash;
  } catch (error) {
    console.error('Error transferring USDC:', error);
    throw error;
  }
}

/**
 * Wait for USDC transaction confirmation
 */
export async function waitForUSDCTransaction(hash: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const checkTransaction = async () => {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        });
        
        if (receipt) {
          resolve(receipt);
        } else {
          setTimeout(checkTransaction, 2000); // Check again in 2 seconds
        }
      } catch (error) {
        reject(error);
      }
    };

    checkTransaction();
  });
}

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get USDC token info
 */
export async function getUSDCInfo(): Promise<{ symbol: string; decimals: number }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not available');
  }

  try {
    // Get symbol
    const symbolData = await window.ethereum.request({
      method: 'eth_call',
      params: [
        {
          to: USDC_CONTRACT_ADDRESS,
          data: '0x95d89b41', // symbol()
        },
        'latest'
      ]
    });

    // Get decimals
    const decimalsData = await window.ethereum.request({
      method: 'eth_call',
      params: [
        {
          to: USDC_CONTRACT_ADDRESS,
          data: '0x313ce567', // decimals()
        },
        'latest'
      ]
    });

    // Decode symbol (remove padding and convert from hex)
    const symbolHex = symbolData.slice(2); // Remove '0x'
    const symbolLength = parseInt(symbolHex.slice(0, 64), 16);
    const symbolBytes = symbolHex.slice(64, 64 + symbolLength * 2);
    const symbol = Buffer.from(symbolBytes, 'hex').toString('utf8');

    // Decode decimals
    const decimals = parseInt(decimalsData.slice(2), 16);

    return { symbol, decimals };
  } catch (error) {
    console.error('Error getting USDC info:', error);
    // Return default values if contract call fails
    return { symbol: 'USDC', decimals: 6 };
  }
}

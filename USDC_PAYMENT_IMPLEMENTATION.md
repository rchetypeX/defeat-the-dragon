# USDC Payment Implementation for Subscriptions

## Overview

The subscription system has been updated to use **USDC payments on Base Network** instead of ETH. This provides users with a more stable and predictable payment experience, as USDC maintains a 1:1 peg with USD.

## Key Changes

### 1. Payment Token
- **Before**: ETH payments (volatile pricing)
- **After**: USDC payments (stable $1 = 1 USDC)

### 2. Pricing Structure
- **Monthly**: $4.50 USDC (30 days)
- **Annual**: $45.00 USDC (365 days) - Save 2 months!

### 3. Technical Implementation

#### USDC Contract Details
- **Contract Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Network**: Base Network (Chain ID: 8453)
- **Decimals**: 6 (unlike ETH which has 18)
- **Symbol**: USDC

#### New Files Created
- `apps/web/lib/usdcPayment.ts` - USDC payment utilities
- `supabase/migrations/20250127000005_update_subscription_pricing_to_usdc.sql` - Database migration

#### Updated Files
- `apps/web/components/ui/SubscriptionPopup.tsx` - Updated to use USDC payments
- `apps/web/app/api/subscriptions/create/route.ts` - Updated provider to 'usdc'
- `apps/web/lib/database.types.ts` - Added `price_usdc` field
- `SUBSCRIPTION_SETUP.md` - Updated documentation
- `apps/web/SUBSCRIPTION_PRICING_MANAGEMENT.md` - Updated pricing guide

## USDC Payment Flow

### 1. User Experience
1. User clicks "Inspiration Boon" in shop
2. Subscription popup opens with USDC pricing
3. User connects wallet (MetaMask or similar)
4. System switches to Base Network automatically
5. **NEW**: System checks USDC balance
6. User confirms USDC payment
7. Transaction is processed on Base Network
8. System waits for confirmation
9. Subscription is created in Supabase
10. User's "Inspired" status is updated

### 2. Technical Flow
1. **Balance Check**: `checkUSDCBalance()` verifies user has sufficient USDC
2. **Transfer**: `transferUSDC()` executes the USDC transfer
3. **Confirmation**: `waitForUSDCTransaction()` waits for blockchain confirmation
4. **Database Update**: Creates subscription record with `provider: 'usdc'`

## USDC Payment Functions

### Core Functions
```typescript
// Check USDC balance
checkUSDCBalance(userAddress: string, requiredAmount: number)

// Transfer USDC
transferUSDC({ to, amount, from }: USDCTransferParams)

// Wait for transaction confirmation
waitForUSDCTransaction(hash: string)

// Format USDC for display
formatUSDC(amount: number)
```

### Utility Functions
```typescript
// Convert USDC to smallest unit
usdcToSmallestUnit(amount: number): bigint

// Convert smallest unit back to USDC
smallestUnitToUsdc(amount: bigint): number

// Get USDC token info
getUSDCInfo(): Promise<{ symbol: string; decimals: number }>
```

## Database Changes

### New Column
- `price_usdc` DECIMAL(10,2) - Price in USDC

### Updated Provider
- Subscription records now use `provider: 'usdc'` instead of `'ethereum'`

## Benefits of USDC Payments

### For Users
- **Stable Pricing**: No ETH volatility concerns
- **Predictable Costs**: Always know exactly what you're paying
- **Wider Adoption**: USDC is widely accepted and trusted
- **Lower Gas Fees**: Base Network has very low transaction costs

### For Developers
- **Simplified Pricing**: No need to track ETH/USD conversion rates
- **Better UX**: Users see familiar USD amounts
- **Reduced Support**: Fewer issues with price fluctuations
- **Compliance**: USDC is regulated and compliant

## Testing

### Test USDC Sources
1. **Base Network Faucet**: Get test USDC for development
2. **Bridge from Ethereum**: Bridge USDC from mainnet to Base
3. **DEX Swaps**: Swap ETH for USDC on Base Network

### Test Flow
1. Ensure wallet is connected to Base Network
2. Have sufficient USDC balance
3. Test monthly and annual subscriptions
4. Verify transaction on BaseScan
5. Check subscription status in database

## Security Considerations

### Smart Contract Security
- USDC contract is audited and widely used
- Base Network is secure and reliable
- All transactions are verified on-chain

### User Protection
- Balance checks prevent failed transactions
- Clear error messages for insufficient funds
- Transaction confirmation before database updates

## Migration Notes

### For Existing Users
- Existing ETH-based subscriptions continue to work
- New subscriptions use USDC
- No data migration required for existing records

### For Developers
- Run the database migration: `20250127000005_update_subscription_pricing_to_usdc.sql`
- Update environment variables if needed
- Test the complete USDC payment flow

## Future Enhancements

### Potential Improvements
1. **Multi-token Support**: Support other stablecoins (USDT, DAI)
2. **Fiat On-ramp**: Direct USD to USDC conversion
3. **Recurring Payments**: Automated subscription renewals
4. **Payment Analytics**: Track payment success rates and user behavior

### Integration Opportunities
1. **Coinbase Integration**: Leverage Coinbase's USDC infrastructure
2. **Base App Integration**: Native USDC support in Base App
3. **DeFi Integration**: Yield-bearing USDC subscriptions

## Support

### Common Issues
1. **Insufficient USDC**: User needs to acquire USDC first
2. **Wrong Network**: Ensure wallet is on Base Network
3. **Transaction Failures**: Check gas fees and network congestion

### Resources
- [Base Network Documentation](https://docs.base.org/)
- [USDC on Base](https://docs.base.org/guides/deploy-smart-contracts)
- [Coinbase USDC](https://www.coinbase.com/usdc)

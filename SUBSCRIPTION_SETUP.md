# Subscription System Setup Guide

## Overview
The subscription system allows users to pay 0.0001 ETH on Base Network to get an "Inspiration Boon" subscription for 30 days. This enables them to earn Sparks from successful focus sessions.

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env.local` file:

```bash
# Your Base Network wallet address to receive payments
NEXT_PUBLIC_MERCHANT_WALLET=0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9
```

### 2. Database Migration
Run the database migration to add the required columns:

```sql
-- Run this in your Supabase SQL Editor
-- Migration: 20250101_add_inspired_status.sql

-- Add is_inspired column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS is_inspired BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at column if it doesn't exist
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance when checking inspired status
CREATE INDEX IF NOT EXISTS idx_players_is_inspired ON players(is_inspired);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_players_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_players_timestamp_trigger ON players;
CREATE TRIGGER update_players_timestamp_trigger
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_players_timestamp();
```

### 3. Features Implemented

#### Subscription Popup
- **Location**: `apps/web/components/ui/SubscriptionPopup.tsx`
- **Features**:
  - ETH payment on Base Network
  - Automatic network switching
  - Transaction confirmation
  - BaseScan link for verification
  - Error handling

#### API Endpoint
- **Location**: `apps/web/app/api/subscriptions/create/route.ts`
- **Features**:
  - Creates subscription record
  - Updates user's "Inspired" status
  - Handles both standard and wallet auth users

#### Shop Integration
- **Location**: `apps/web/components/ui/ShopPopup.tsx`
- **Features**:
  - "Inspiration Boon" button opens subscription popup
  - Refreshes inventory after successful subscription

#### Session Rewards
- **Location**: `apps/web/app/api/sessions/complete/route.ts`
- **Features**:
  - Awards Sparks to inspired users
  - Uses `computeSparks()` function from engine
  - Checks `player.is_inspired` status

### 4. User Flow

1. **User clicks "Inspiration Boon" button** in shop
2. **Subscription popup opens** with payment details
3. **User connects wallet** (MetaMask or similar)
4. **System switches to Base Network** automatically
5. **User confirms payment** of 0.0001 ETH
6. **Transaction is processed** on Base Network
7. **System waits for confirmation** (2-second intervals)
8. **Subscription is created** in Supabase
9. **User's "Inspired" status is updated** to true
10. **User can now earn Sparks** from focus sessions

### 5. Testing

#### Test Wallet Setup
1. Get some test ETH from Base Network faucet
2. Set up MetaMask with Base Network
3. Use test wallet for development

#### Test Subscription Flow
1. Open shop in the app
2. Click "Inspiration Boon" button
3. Connect test wallet
4. Confirm payment
5. Verify subscription in database
6. Complete a focus session
7. Verify Sparks are awarded

### 6. Production Deployment

#### Environment Setup
1. Set `NEXT_PUBLIC_MERCHANT_WALLET` to your production wallet
2. Ensure Base Network is configured in your deployment
3. Test the complete flow in production

#### Monitoring
- Monitor subscription transactions on BaseScan
- Check Supabase logs for subscription creation
- Verify user "Inspired" status updates

### 7. Security Considerations

- **Wallet Address**: Keep your merchant wallet address secure
- **Transaction Verification**: All transactions are verified on-chain
- **User Authentication**: Subscription creation requires valid user session
- **Database Security**: RLS policies protect user subscription data

### 8. Troubleshooting

#### Common Issues
1. **Network not found**: Ensure Base Network is added to MetaMask
2. **Insufficient funds**: User needs ETH on Base Network
3. **Transaction failed**: Check gas fees and network congestion
4. **Subscription not created**: Check API logs and database permissions

#### Debug Steps
1. Check browser console for errors
2. Verify wallet connection
3. Check transaction on BaseScan
4. Verify database records
5. Test with different wallet

## Support
For issues or questions about the subscription system, check the logs and verify the setup steps above.

-- Migration to update subscription pricing from ETH to USDC on Base Network
-- This changes the pricing structure to use USDC instead of ETH

-- Update the subscription_pricing_master table to use USDC pricing
-- Remove price_eth column and add price_usdc column

-- First, add the new price_usdc column
ALTER TABLE subscription_pricing_master 
ADD COLUMN IF NOT EXISTS price_usdc DECIMAL(10, 2);

-- Update existing pricing to use USDC instead of ETH
-- Convert from ETH prices to USDC prices (assuming 1 ETH = $2250 USD)
-- Monthly: 0.002 ETH = $4.50 → $4.50 USDC
-- Annual: 0.02 ETH = $45.00 → $45.00 USDC

UPDATE subscription_pricing_master 
SET price_usdc = CASE 
  WHEN subscription_type = 'monthly' THEN 4.50
  WHEN subscription_type = 'annual' THEN 45.00
  ELSE price_usdc
END,
updated_at = NOW()
WHERE subscription_type IN ('monthly', 'annual');

-- Set default values for any NULL price_usdc
UPDATE subscription_pricing_master 
SET price_usdc = 4.50, updated_at = NOW()
WHERE subscription_type = 'monthly' AND price_usdc IS NULL;

UPDATE subscription_pricing_master 
SET price_usdc = 45.00, updated_at = NOW()
WHERE subscription_type = 'annual' AND price_usdc IS NULL;

-- Make price_usdc NOT NULL after setting all values
ALTER TABLE subscription_pricing_master 
ALTER COLUMN price_usdc SET NOT NULL;

-- Add a comment to the table explaining the change
COMMENT ON TABLE subscription_pricing_master IS 'Subscription pricing in USDC on Base Network (previously ETH)';

-- Add comments to the columns
COMMENT ON COLUMN subscription_pricing_master.price_usdc IS 'Price in USDC (e.g., 4.50 for $4.50)';
COMMENT ON COLUMN subscription_pricing_master.price_eth IS 'Price in ETH (deprecated - use price_usdc instead)';

-- Create an index on price_usdc for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_usdc ON subscription_pricing_master(price_usdc);

-- Verify the update
DO $$
DECLARE
    monthly_price DECIMAL(10, 2);
    annual_price DECIMAL(10, 2);
BEGIN
    SELECT price_usdc INTO monthly_price 
    FROM subscription_pricing_master 
    WHERE subscription_type = 'monthly';
    
    SELECT price_usdc INTO annual_price 
    FROM subscription_pricing_master 
    WHERE subscription_type = 'annual';
    
    RAISE NOTICE 'Updated subscription pricing: Monthly = $%, Annual = $%', monthly_price, annual_price;
END $$;

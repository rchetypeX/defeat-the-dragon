-- Fix Subscription Pricing to Use USDC Instead of ETH
-- This script ensures the subscription_pricing_master table is properly configured for USDC payments

-- 1. First, let's check the current state
DO $$
DECLARE
    has_price_usdc BOOLEAN;
    has_price_eth BOOLEAN;
    monthly_price_eth DECIMAL(10,6);
    monthly_price_usdc DECIMAL(10,2);
    annual_price_eth DECIMAL(10,6);
    annual_price_usdc DECIMAL(10,2);
BEGIN
    RAISE NOTICE '🔍 Checking current subscription pricing table state...';
    
    -- Check if price_usdc column exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_pricing_master' 
        AND column_name = 'price_usdc'
    ) INTO has_price_usdc;
    
    -- Check if price_eth column exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_pricing_master' 
        AND column_name = 'price_eth'
    ) INTO has_price_eth;
    
    RAISE NOTICE '   price_usdc column exists: %', has_price_usdc;
    RAISE NOTICE '   price_eth column exists: %', has_price_eth;
    
    -- Check current pricing values
    IF has_price_usdc THEN
        SELECT price_usdc INTO monthly_price_usdc 
        FROM subscription_pricing_master 
        WHERE subscription_type = 'monthly';
        
        SELECT price_usdc INTO annual_price_usdc 
        FROM subscription_pricing_master 
        WHERE subscription_type = 'annual';
        
        RAISE NOTICE '   Current USDC pricing - Monthly: $%, Annual: $%', monthly_price_usdc, annual_price_usdc;
    END IF;
    
    IF has_price_eth THEN
        SELECT price_eth INTO monthly_price_eth 
        FROM subscription_pricing_master 
        WHERE subscription_type = 'monthly';
        
        SELECT price_eth INTO annual_price_eth 
        FROM subscription_pricing_master 
        WHERE subscription_type = 'annual';
        
        RAISE NOTICE '   Current ETH pricing - Monthly: % ETH, Annual: % ETH', monthly_price_eth, annual_price_eth;
    END IF;
END $$;

-- 2. Add price_usdc column if it doesn't exist
ALTER TABLE subscription_pricing_master 
ADD COLUMN IF NOT EXISTS price_usdc DECIMAL(10, 2);

-- 3. Update existing pricing to use USDC values
-- Monthly: $4.50 USDC, Annual: $45.00 USDC
UPDATE subscription_pricing_master 
SET price_usdc = CASE 
  WHEN subscription_type = 'monthly' THEN 4.50
  WHEN subscription_type = 'annual' THEN 45.00
  ELSE price_usdc
END,
updated_at = NOW()
WHERE subscription_type IN ('monthly', 'annual');

-- 4. Set default values for any NULL price_usdc
UPDATE subscription_pricing_master 
SET price_usdc = 4.50, updated_at = NOW()
WHERE subscription_type = 'monthly' AND price_usdc IS NULL;

UPDATE subscription_pricing_master 
SET price_usdc = 45.00, updated_at = NOW()
WHERE subscription_type = 'annual' AND price_usdc IS NULL;

-- 5. Make price_usdc NOT NULL after setting all values
ALTER TABLE subscription_pricing_master 
ALTER COLUMN price_usdc SET NOT NULL;

-- 6. Update the table and column comments
COMMENT ON TABLE subscription_pricing_master IS 'Subscription pricing in USDC on Base Network (previously ETH)';
COMMENT ON COLUMN subscription_pricing_master.price_usdc IS 'Price in USDC (e.g., 4.50 for $4.50)';
COMMENT ON COLUMN subscription_pricing_master.price_eth IS 'Price in ETH (deprecated - use price_usdc instead)';

-- 7. Create index on price_usdc for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_usdc ON subscription_pricing_master(price_usdc);

-- 8. Update the benefits to reflect USDC pricing
UPDATE subscription_pricing_master 
SET benefits = ARRAY[
  'Earn Sparks from successful focus sessions',
  'Access to exclusive shop items',
  'Monthly drops of Sparks-exclusive items',
  'USDC payments on Base Network'
],
updated_at = NOW()
WHERE subscription_type = 'monthly';

UPDATE subscription_pricing_master 
SET benefits = ARRAY[
  'Earn Sparks from successful focus sessions',
  'Access to exclusive shop items',
  'Monthly drops of Sparks-exclusive items',
  'USDC payments on Base Network',
  '2 months FREE compared to monthly pricing'
],
updated_at = NOW()
WHERE subscription_type = 'annual';

-- 9. Update descriptions to mention USDC
UPDATE subscription_pricing_master 
SET description = 'Monthly Inspiration Boon - USDC Payment',
    updated_at = NOW()
WHERE subscription_type = 'monthly';

UPDATE subscription_pricing_master 
SET description = 'Annual Inspiration Boon - USDC Payment (2 months FREE!)',
    updated_at = NOW()
WHERE subscription_type = 'annual';

-- 10. Verify the final state
DO $$
DECLARE
    final_monthly_price DECIMAL(10, 2);
    final_annual_price DECIMAL(10, 2);
    final_monthly_desc TEXT;
    final_annual_desc TEXT;
BEGIN
    RAISE NOTICE '✅ Final verification of subscription pricing...';
    
    -- Check final pricing
    SELECT price_usdc, description INTO final_monthly_price, final_monthly_desc
    FROM subscription_pricing_master 
    WHERE subscription_type = 'monthly';
    
    SELECT price_usdc, description INTO final_annual_price, final_annual_desc
    FROM subscription_pricing_master 
    WHERE subscription_type = 'annual';
    
    RAISE NOTICE '   Monthly: $% - %', final_monthly_price, final_monthly_desc;
    RAISE NOTICE '   Annual: $% - %', final_annual_price, final_annual_desc;
    
    RAISE NOTICE '🎉 Subscription pricing successfully updated to USDC!';
    RAISE NOTICE '💡 Users will now see stable USDC pricing instead of volatile ETH';
END $$;

-- 11. Show the final table state
SELECT 
    subscription_type,
    price_eth,
    price_usd,
    price_usdc,
    duration_days,
    description,
    benefits,
    is_active,
    updated_at
FROM subscription_pricing_master
ORDER BY subscription_type;

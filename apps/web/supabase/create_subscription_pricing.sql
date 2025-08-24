-- Create Subscription Pricing Master Table
-- This table allows you to edit pricing centrally and have it update across all app instances

-- Create the subscription_pricing_master table
CREATE TABLE IF NOT EXISTS subscription_pricing_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_type VARCHAR(50) NOT NULL UNIQUE, -- 'monthly', 'annual'
  price_eth DECIMAL(10, 6) NOT NULL, -- Price in ETH (e.g., 0.002)
  price_usd DECIMAL(10, 2) NOT NULL, -- Price in USD for reference
  duration_days INTEGER NOT NULL, -- Duration in days (30 for monthly, 365 for annual)
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT, -- Optional description
  benefits TEXT[], -- Array of benefits for this subscription type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_type ON subscription_pricing_master(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_active ON subscription_pricing_master(is_active);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_subscription_pricing_timestamp_trigger ON subscription_pricing_master;
CREATE TRIGGER update_subscription_pricing_timestamp_trigger
  BEFORE UPDATE ON subscription_pricing_master
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_pricing_timestamp();

-- Insert initial pricing data
INSERT INTO subscription_pricing_master (subscription_type, price_eth, price_usd, duration_days, description, benefits) VALUES
('monthly', 0.002, 4.50, 30, 'Monthly Inspiration Boon', ARRAY[
  'Earn Sparks from successful focus sessions',
  'Access to exclusive shop items',
  'Monthly drops of Sparks-exclusive items'
]),
('annual', 0.02, 45.00, 365, 'Annual Inspiration Boon (2 months FREE!)', ARRAY[
  'Earn Sparks from successful focus sessions',
  'Access to exclusive shop items',
  'Monthly drops of Sparks-exclusive items',
  '2 months FREE compared to monthly pricing'
])
ON CONFLICT (subscription_type) DO UPDATE SET
  price_eth = EXCLUDED.price_eth,
  price_usd = EXCLUDED.price_usd,
  duration_days = EXCLUDED.duration_days,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  updated_at = NOW();

-- Create RLS policies for the table
ALTER TABLE subscription_pricing_master ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active pricing
CREATE POLICY "Allow read access to active subscription pricing" ON subscription_pricing_master
  FOR SELECT USING (is_active = true);

-- Allow only service role to manage pricing (for admin updates)
CREATE POLICY "Allow service role full access to subscription pricing" ON subscription_pricing_master
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the setup
SELECT 
  subscription_type,
  price_eth,
  price_usd,
  duration_days,
  description,
  benefits,
  is_active,
  created_at,
  updated_at
FROM subscription_pricing_master
ORDER BY subscription_type;

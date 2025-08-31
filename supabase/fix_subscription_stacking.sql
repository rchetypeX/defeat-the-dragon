-- Migration to fix user_subscriptions table for subscription stacking
-- This allows users to have multiple active subscriptions that stack their duration

-- First, let's check the current table structure
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current user_subscriptions table structure...';
    
    -- Check if user_id is currently the primary key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_subscriptions' 
        AND constraint_type = 'PRIMARY KEY' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '⚠️  user_subscriptions table has user_id as primary key - this needs to be fixed for stacking';
    ELSE
        RAISE NOTICE '✅ user_subscriptions table structure is already correct for stacking';
        RETURN;
    END IF;
END $$;

-- Create a temporary table with the correct structure
CREATE TABLE IF NOT EXISTS user_subscriptions_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  provider VARCHAR(50),
  external_id VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy existing data to the new table
INSERT INTO user_subscriptions_new (
  user_id, 
  subscription_type, 
  status, 
  provider, 
  external_id, 
  started_at, 
  expires_at, 
  updated_at
)
SELECT 
  user_id, 
  subscription_type, 
  status, 
  provider, 
  external_id, 
  started_at, 
  expires_at, 
  updated_at
FROM user_subscriptions;

-- Drop the old table
DROP TABLE user_subscriptions;

-- Rename the new table to the original name
ALTER TABLE user_subscriptions_new RENAME TO user_subscriptions;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider ON user_subscriptions(provider);

-- Enable Row Level Security (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_user_subscriptions_timestamp_trigger ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_timestamp_trigger
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_timestamp();

-- Verify the new structure
DO $$
BEGIN
    RAISE NOTICE '🔍 Verifying new table structure...';
    
    -- Check if the table now has an id column as primary key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_subscriptions' 
        AND constraint_type = 'PRIMARY KEY' 
        AND constraint_name LIKE '%id%'
    ) THEN
        RAISE NOTICE '✅ user_subscriptions table now has id as primary key - stacking is supported!';
    ELSE
        RAISE NOTICE '❌ Failed to update table structure';
    END IF;
    
    -- Check if user_id is no longer the primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_subscriptions' 
        AND constraint_type = 'PRIMARY KEY' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '✅ user_id is no longer the primary key';
    ELSE
        RAISE NOTICE '❌ user_id is still the primary key - this needs manual fixing';
    END IF;
END $$;

-- Show the final table structure
-- Note: Use Supabase's table view to see the final structure

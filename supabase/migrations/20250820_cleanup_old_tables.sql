-- Migration to clean up old tables that weren't properly removed
-- This will safely drop the tables that are no longer needed
-- BUT KEEP subscriptions and shop_items for proper implementation

-- Drop RLS policies first (if they exist)
DO $$ 
BEGIN
    -- Drop policies for classes table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes') THEN
        DROP POLICY IF EXISTS "Users can view own classes" ON classes;
        DROP POLICY IF EXISTS "Users can insert own classes" ON classes;
        DROP POLICY IF EXISTS "Users can update own classes" ON classes;
    END IF;
    
    -- Drop policies for loot table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loot') THEN
        DROP POLICY IF EXISTS "Users can view own loot" ON loot;
        DROP POLICY IF EXISTS "Users can insert own loot" ON loot;
        DROP POLICY IF EXISTS "Users can update own loot" ON loot;
    END IF;
    
    -- Drop policies for inventory table (if it still exists)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory') THEN
        DROP POLICY IF EXISTS "Users can view own inventory" ON inventory;
        DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory;
        DROP POLICY IF EXISTS "Users can update own inventory" ON inventory;
        DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory;
    END IF;
    
    -- Drop policies for push_subscriptions table (if it still exists)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
        DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
        DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
        DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
    END IF;
    
    -- NOTE: We're KEEPING subscriptions and shop_items tables
    -- but will update their policies for proper admin access
END $$;

-- Drop only the truly unnecessary tables
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS loot CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

-- Create shop_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  price_sale INTEGER NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL,
  class_lock VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  provider VARCHAR(50),
  external_id VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  user_tag VARCHAR(50),
  auto_tag_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subscription_type)
);

-- Add missing columns to shop_items if they don't exist
DO $$
BEGIN
    -- Add admin columns to shop_items if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_items' AND column_name = 'is_active') THEN
        ALTER TABLE shop_items ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_items' AND column_name = 'created_by') THEN
        ALTER TABLE shop_items ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_items' AND column_name = 'created_at') THEN
        ALTER TABLE shop_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_items' AND column_name = 'updated_at') THEN
        ALTER TABLE shop_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add missing columns to subscriptions if they don't exist
DO $$
BEGIN
    -- Add user tag column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_tag') THEN
        ALTER TABLE subscriptions ADD COLUMN user_tag VARCHAR(50);
    END IF;
    
    -- Add automation trigger column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'auto_tag_enabled') THEN
        ALTER TABLE subscriptions ADD COLUMN auto_tag_enabled BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Create function to automatically update user tags based on subscription status
CREATE OR REPLACE FUNCTION update_user_tag_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if auto_tag_enabled is true
    IF NEW.auto_tag_enabled = true THEN
        -- Update user tag based on subscription status
        IF NEW.status = 'active' THEN
            NEW.user_tag = 'subscriber';
        ELSE
            NEW.user_tag = 'free_user';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user tags
DROP TRIGGER IF EXISTS trigger_update_user_tag ON subscriptions;
CREATE TRIGGER trigger_update_user_tag
    BEFORE INSERT OR UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_user_tag_from_subscription();

-- Enable RLS on tables
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for shop_items (admin access)
DROP POLICY IF EXISTS "Users can view shop items" ON shop_items;
DROP POLICY IF EXISTS "Users can insert shop items" ON shop_items;
DROP POLICY IF EXISTS "Users can update shop items" ON shop_items;
DROP POLICY IF EXISTS "Anyone can view active shop items" ON shop_items;
DROP POLICY IF EXISTS "Admins can manage shop items" ON shop_items;

-- Create new policies for shop_items
CREATE POLICY "Anyone can view active shop items" ON shop_items 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shop items" ON shop_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Update RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;

-- Create new policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_items_sku ON shop_items(sku);
CREATE INDEX IF NOT EXISTS idx_shop_items_type ON shop_items(type);
CREATE INDEX IF NOT EXISTS idx_shop_items_is_active ON shop_items(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_tag ON subscriptions(user_tag);

-- Verify cleanup
DO $$
BEGIN
    -- Check if old tables are gone
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
        RAISE NOTICE 'Warning: classes table still exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loot') THEN
        RAISE NOTICE 'Warning: loot table still exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
        RAISE NOTICE 'Warning: inventory table still exists';
    END IF;
    
    -- Check if kept tables are present
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        RAISE NOTICE 'Warning: subscriptions table missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_items') THEN
        RAISE NOTICE 'Warning: shop_items table missing';
    END IF;
    
    RAISE NOTICE 'Cleanup completed successfully - kept subscriptions and shop_items';
END $$;

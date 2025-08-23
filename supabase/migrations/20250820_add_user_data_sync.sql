-- Migration to add comprehensive user data synchronization
-- This will store all user data in Supabase for cross-device consistency

-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  accessibility JSONB NOT NULL DEFAULT '{"highContrast": false, "dyslexiaFont": false, "ttsEnabled": false}',
  equipped_character VARCHAR(50) NOT NULL DEFAULT 'fighter',
  equipped_background VARCHAR(50) NOT NULL DEFAULT 'forest',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_inventory table for storing user's items
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('cosmetic', 'pet', 'trinket', 'character', 'background')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  equipped BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Create user_subscriptions table for storing subscription data
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  provider VARCHAR(50),
  external_id VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_purchases table for storing purchase history
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  price_coins INTEGER NOT NULL DEFAULT 0,
  price_sparks INTEGER NOT NULL DEFAULT 0,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table for storing achievement progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_id ON user_inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
-- user_settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- user_inventory policies
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON user_inventory;

CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON user_inventory FOR DELETE USING (auth.uid() = user_id);

-- user_subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- user_purchases policies
DROP POLICY IF EXISTS "Users can view own purchases" ON user_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON user_purchases;

CREATE POLICY "Users can view own purchases" ON user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_achievements policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;

CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Update the handle_new_user function to create default settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'));
  
  INSERT INTO public.players (user_id, display_name, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'),
    NEW.raw_user_meta_data->>'wallet_address'
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Add default inventory items
  INSERT INTO public.user_inventory (user_id, item_id, item_type, equipped)
  VALUES 
    (NEW.id, 'fighter', 'character', true),
    (NEW.id, 'forest', 'background', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update settings timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update settings timestamp
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
CREATE TRIGGER update_user_settings_timestamp
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_settings_timestamp();

-- Create function to update subscription timestamp
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update subscription timestamp
DROP TRIGGER IF EXISTS update_user_subscriptions_timestamp ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_timestamp
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();

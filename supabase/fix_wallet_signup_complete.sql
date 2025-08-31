-- Comprehensive fix for wallet signup issues
-- This script addresses all the problems preventing wallet signup from working

-- 1. First, ensure all necessary tables exist with correct schema
-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  accessibility JSONB NOT NULL DEFAULT '{"highContrast": false, "dyslexiaFont": false, "ttsEnabled": false}',
  equipped_character VARCHAR(50) NOT NULL DEFAULT 'fighter',
  equipped_background VARCHAR(50) NOT NULL DEFAULT 'forest',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_inventory table if it doesn't exist
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

-- 2. Ensure players table has all necessary columns
DO $$
BEGIN
    -- Add wallet_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'wallet_address') THEN
        ALTER TABLE players ADD COLUMN wallet_address VARCHAR(42) UNIQUE;
    END IF;
    
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'display_name') THEN
        ALTER TABLE players ADD COLUMN display_name VARCHAR(50);
    END IF;
    
    -- Add is_inspired column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'is_inspired') THEN
        ALTER TABLE players ADD COLUMN is_inspired BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'updated_at') THEN
        ALTER TABLE players ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add needsAdventurerName column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'needsAdventurerName') THEN
        ALTER TABLE players ADD COLUMN "needsAdventurerName" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_wallet_address ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_players_display_name ON players(display_name);
CREATE INDEX IF NOT EXISTS idx_players_is_inspired ON players(is_inspired);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_id ON user_inventory(item_id);

-- 4. Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
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

-- 5.5. Ensure unique constraint exists on user_inventory
DO $$
BEGIN
    -- Check if the unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_inventory_user_id_item_id_key' 
        AND conrelid = 'user_inventory'::regclass
    ) THEN
        -- Add the unique constraint if it doesn't exist
        ALTER TABLE user_inventory ADD CONSTRAINT user_inventory_user_id_item_id_key UNIQUE (user_id, item_id);
        RAISE NOTICE 'Added unique constraint on user_inventory(user_id, item_id)';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on user_inventory(user_id, item_id)';
    END IF;
END $$;

-- 6. Fix the handle_new_user function completely
-- First, drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the corrected handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_address TEXT;
  display_name TEXT;
BEGIN
  -- Extract wallet address and display name from metadata
  wallet_address := NEW.raw_user_meta_data->>'wallet_address';
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer');
  
  -- Insert into players table with correct starting values
  INSERT INTO public.players (
    user_id, 
    display_name, 
    wallet_address,
    level,
    xp,
    coins,
    sparks,
    is_inspired,
    needsAdventurerName,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    display_name,
    wallet_address,
    1,  -- Default level
    0,  -- Default XP
    0,  -- Start with 0 coins (not 100)
    0,  -- Start with 0 sparks (not 50)
    false, -- Default inspired status
    true, -- Show name change popup for new users
    NOW(),
    NOW()
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add default inventory items
  INSERT INTO public.user_inventory (user_id, item_id, item_type, equipped)
  VALUES 
    (NEW.id, 'fighter', 'character', true),
    (NEW.id, 'forest', 'background', true)
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 9. Create function to update player timestamp
CREATE OR REPLACE FUNCTION update_players_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_players_timestamp_trigger ON players;
CREATE TRIGGER update_players_timestamp_trigger
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_players_timestamp();

-- 11. Create function to update settings timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically update settings timestamp
DROP TRIGGER IF EXISTS update_settings_timestamp_trigger ON user_settings;
CREATE TRIGGER update_settings_timestamp_trigger
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();

-- 13. Verify the setup
DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
    tables_exist BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    -- Check if tables exist
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'players' 
        AND table_schema = 'public'
    ) AND EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_settings' 
        AND table_schema = 'public'
    ) AND EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_inventory' 
        AND table_schema = 'public'
    ) INTO tables_exist;
    
    -- Report status
    IF function_exists THEN
        RAISE NOTICE '✅ handle_new_user function exists';
    ELSE
        RAISE NOTICE '❌ handle_new_user function missing';
    END IF;
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ on_auth_user_created trigger exists';
    ELSE
        RAISE NOTICE '❌ on_auth_user_created trigger missing';
    END IF;
    
    IF tables_exist THEN
        RAISE NOTICE '✅ All required tables exist';
    ELSE
        RAISE NOTICE '❌ Some required tables are missing';
    END IF;
    
    RAISE NOTICE 'Wallet signup setup verification complete';
END $$;

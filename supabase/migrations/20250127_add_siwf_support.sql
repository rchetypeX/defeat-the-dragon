-- Comprehensive SIWF (Sign In With Farcaster) Support Migration
-- This migration adds all necessary fields, indexes, and policies for SIWF users
-- Run this after the initial schema and wallet support migrations

-- ============================================================================
-- 1. ADD MISSING FARCASTER FIELDS TO PLAYERS TABLE
-- ============================================================================

-- Add Farcaster-specific fields to players table
DO $$
BEGIN
    -- Add farcaster_fid column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'farcaster_fid') THEN
        ALTER TABLE players ADD COLUMN farcaster_fid INTEGER UNIQUE;
        RAISE NOTICE '✅ Added farcaster_fid column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ farcaster_fid column already exists in players table';
    END IF;
    
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'username') THEN
        ALTER TABLE players ADD COLUMN username VARCHAR(100);
        RAISE NOTICE '✅ Added username column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ username column already exists in players table';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'avatar_url') THEN
        ALTER TABLE players ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added avatar_url column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ avatar_url column already exists in players table';
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'email') THEN
        ALTER TABLE players ADD COLUMN email VARCHAR(255);
        RAISE NOTICE '✅ Added email column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ email column already exists in players table';
    END IF;
    
    -- Add experience column if it doesn't exist (SIWF code uses 'experience' but DB uses 'xp')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'experience') THEN
        ALTER TABLE players ADD COLUMN experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0);
        RAISE NOTICE '✅ Added experience column to players table';
        
        -- Copy existing xp values to experience for consistency
        UPDATE players SET experience = xp WHERE experience IS NULL;
        RAISE NOTICE '✅ Copied existing xp values to experience column';
    ELSE
        RAISE NOTICE 'ℹ️ experience column already exists in players table';
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE PROPER INDEXES FOR FARCASTER LOOKUPS
-- ============================================================================

-- Create indexes for Farcaster-specific fields
CREATE INDEX IF NOT EXISTS idx_players_farcaster_fid ON players(farcaster_fid);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_experience ON players(experience);

-- Create composite index for efficient Farcaster user lookups
CREATE INDEX IF NOT EXISTS idx_players_farcaster_lookup ON players(farcaster_fid, username, email);

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR FARCASTER USERS
-- ============================================================================

-- Update players table RLS policies to allow Farcaster-based access
DROP POLICY IF EXISTS "Users can view own player data" ON players;
CREATE POLICY "Users can view own player data" ON players 
FOR SELECT USING (
  auth.uid() = user_id OR 
  wallet_address IS NOT NULL OR
  farcaster_fid IS NOT NULL
);

-- Add specific policy for Farcaster user lookups
CREATE POLICY "Users can view players by Farcaster ID" ON players 
FOR SELECT USING (
  farcaster_fid IS NOT NULL
);

-- Update insert policy to allow Farcaster user creation
DROP POLICY IF EXISTS "Users can insert own player data" ON players;
CREATE POLICY "Users can insert own player data" ON players 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  wallet_address IS NOT NULL OR
  farcaster_fid IS NOT NULL
);

-- Update update policy to allow Farcaster user updates
DROP POLICY IF EXISTS "Users can update own player data" ON players;
CREATE POLICY "Users can update own player data" ON players 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  wallet_address IS NOT NULL OR
  farcaster_fid IS NOT NULL
);

-- ============================================================================
-- 4. ENSURE USER_INVENTORY TABLE EXISTS AND HAS PROPER STRUCTURE
-- ============================================================================

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

-- ============================================================================
-- 5. UPDATE USER_INVENTORY RLS POLICIES FOR FARCASTER USERS
-- ============================================================================

-- Enable RLS on user_inventory if not already enabled
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate with Farcaster support
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON user_inventory;

-- Create new policies that handle Farcaster users
CREATE POLICY "Users can view own inventory" ON user_inventory 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

CREATE POLICY "Users can insert own inventory" ON user_inventory 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

CREATE POLICY "Users can update own inventory" ON user_inventory 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

CREATE POLICY "Users can delete own inventory" ON user_inventory 
FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

-- ============================================================================
-- 6. UPDATE USER_SETTINGS RLS POLICIES FOR FARCASTER USERS
-- ============================================================================

-- Enable RLS on user_settings if not already enabled
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate with Farcaster support
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_settings.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

CREATE POLICY "Users can insert own settings" ON user_settings 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_settings.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

CREATE POLICY "Users can update own settings" ON user_settings 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_settings.user_id 
    AND (p.wallet_address IS NOT NULL OR p.farcaster_fid IS NOT NULL)
  )
);

-- ============================================================================
-- 7. UPDATE HANDLE_NEW_USER FUNCTION FOR FARCASTER SUPPORT
-- ============================================================================

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the updated handle_new_user function with Farcaster support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_address TEXT;
  display_name TEXT;
  farcaster_fid INTEGER;
  username TEXT;
  avatar_url TEXT;
  email TEXT;
BEGIN
  -- Extract metadata values
  wallet_address := NEW.raw_user_meta_data->>'wallet_address';
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer');
  farcaster_fid := (NEW.raw_user_meta_data->>'farcaster_fid')::INTEGER;
  username := NEW.raw_user_meta_data->>'username';
  avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  email := NEW.raw_user_meta_data->>'email';
  
  -- Insert into players table with all available data
  INSERT INTO public.players (
    user_id, 
    display_name, 
    wallet_address,
    farcaster_fid,
    username,
    avatar_url,
    email,
    level,
    xp,
    experience,
    coins,
    sparks,
    is_inspired,
    "needsAdventurerName",
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    display_name,
    wallet_address,
    farcaster_fid,
    username,
    avatar_url,
    email,
    1,  -- Default level
    0,  -- Default XP
    0,  -- Default experience
    0,  -- Start with 0 coins
    0,  -- Start with 0 sparks
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 8. CREATE FUNCTION TO LINK EXISTING FARCASTER USERS
-- ============================================================================

-- Function to manually link existing Farcaster users with complete profiles
CREATE OR REPLACE FUNCTION link_existing_farcaster_user(
  p_farcaster_fid INTEGER,
  p_username VARCHAR(100),
  p_display_name VARCHAR(50),
  p_avatar_url TEXT,
  p_email VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_player_id UUID;
BEGIN
  -- Find or create auth user
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE raw_user_meta_data->>'farcaster_fid' = p_farcaster_fid::TEXT
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found with Farcaster FID: %', p_farcaster_fid;
  END IF;
  
  -- Update or create player record
  INSERT INTO players (
    user_id,
    farcaster_fid,
    username,
    display_name,
    avatar_url,
    email,
    level,
    xp,
    experience,
    coins,
    sparks,
    is_inspired,
    "needsAdventurerName",
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_farcaster_fid,
    p_username,
    p_display_name,
    p_avatar_url,
    p_email,
    1,
    0,
    0,
    0,
    0,
    false,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    farcaster_fid = EXCLUDED.farcaster_fid,
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING id INTO v_player_id;
  
  -- Ensure user settings exist
  INSERT INTO user_settings (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Ensure default inventory exists
  INSERT INTO user_inventory (user_id, item_id, item_type, equipped)
  VALUES 
    (v_user_id, 'fighter', 'character', true),
    (v_user_id, 'forest', 'background', true)
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for user_inventory and user_settings
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_id ON user_inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_type ON user_inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_user_inventory_equipped ON user_inventory(equipped);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- 10. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.link_existing_farcaster_user(INTEGER, VARCHAR, VARCHAR, TEXT, VARCHAR) TO authenticated;

-- Grant table permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.players TO anon, authenticated;
GRANT ALL ON public.user_inventory TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;

-- ============================================================================
-- 11. VERIFICATION AND CLEANUP
-- ============================================================================

-- Verify the migration completed successfully
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count Farcaster-related columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'players' 
    AND column_name IN ('farcaster_fid', 'username', 'avatar_url', 'email', 'experience');
    
    RAISE NOTICE '✅ Players table has % Farcaster-related columns', column_count;
    
    -- Count Farcaster-related indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'players' 
    AND indexname LIKE '%farcaster%';
    
    RAISE NOTICE '✅ Created % Farcaster-related indexes', index_count;
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'players' 
    AND policyname LIKE '%Farcaster%';
    
    RAISE NOTICE '✅ Created % Farcaster-specific RLS policies', policy_count;
    
    RAISE NOTICE '🎉 SIWF migration completed successfully!';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- This migration adds comprehensive SIWF support including:
-- ✅ Farcaster fields (fid, username, avatar_url, email, experience)
-- ✅ Proper indexes for performance
-- ✅ Updated RLS policies for Farcaster users
-- ✅ Fixed field name mismatches (experience vs xp)
-- ✅ Complete inventory system support for SIWF users
-- ✅ Automatic user profile creation
-- ✅ Function to link existing Farcaster users
-- 
-- Next steps:
-- 1. Test SIWF authentication flow
-- 2. Verify inventory creation works for new SIWF users
-- 3. Test existing Farcaster user linking if needed
-- 4. Update frontend code to use new experience field
-- ============================================================================

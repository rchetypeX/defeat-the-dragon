-- Fix Players Table Issues
-- This script resolves the problems with the players table:
-- 1. Removes redundant 'experience' column (we already have 'xp')
-- 2. Fixes Farcaster metadata extraction
-- 3. Ensures email sync between auth.users and players table
-- 4. Consolidates the handle_new_user function

-- ============================================================================
-- 1. REMOVE REDUNDANT EXPERIENCE COLUMN
-- ============================================================================

-- Drop the redundant experience column since we already have 'xp'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'experience') THEN
        ALTER TABLE players DROP COLUMN experience;
        RAISE NOTICE '✅ Removed redundant experience column from players table';
    ELSE
        RAISE NOTICE 'ℹ️ experience column does not exist in players table';
    END IF;
END $$;

-- ============================================================================
-- 2. FIX METADATA EXTRACTION IN HANDLE_NEW_USER FUNCTION
-- ============================================================================

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the corrected handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_address TEXT;
  display_name TEXT;
  farcaster_fid INTEGER;
  username TEXT;
  avatar_url TEXT;
  user_email TEXT;
BEGIN
  -- Extract metadata values with proper fallbacks
  wallet_address := NEW.raw_user_meta_data->>'wallet_address';
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    'Adventurer'
  );
  
  -- Handle Farcaster metadata (check multiple possible keys)
  farcaster_fid := COALESCE(
    (NEW.raw_user_meta_data->>'farcaster_fid')::INTEGER,
    (NEW.raw_user_meta_data->>'fid')::INTEGER,
    NULL
  );
  
  username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    'user_' || NEW.id::TEXT
  );
  
  avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  
  -- Use the actual email from auth.users, not metadata
  user_email := NEW.email;
  
  -- Log what we're extracting for debugging
  RAISE NOTICE 'Creating player for user % with: wallet=%, display_name=%, farcaster_fid=%, username=%, email=%', 
    NEW.id, wallet_address, display_name, farcaster_fid, username, user_email;
  
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
    user_email,  -- Use actual email from auth.users
    1,  -- Default level
    0,  -- Default XP (not experience)
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
  
  RAISE NOTICE '✅ Successfully created player record for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. CREATE FUNCTION TO SYNC EXISTING USER EMAILS
-- ============================================================================

-- Function to sync email addresses from auth.users to players table
CREATE OR REPLACE FUNCTION sync_existing_user_emails()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update players table with emails from auth.users where email is NULL
  UPDATE players 
  SET email = auth_users.email
  FROM auth.users auth_users
  WHERE players.user_id = auth_users.id 
    AND players.email IS NULL 
    AND auth_users.email IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Synced % email addresses from auth.users to players table', updated_count;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE FUNCTION TO UPDATE FARCASTER DATA FOR EXISTING USERS
-- ============================================================================

-- Function to update Farcaster data for existing users
CREATE OR REPLACE FUNCTION update_existing_farcaster_users()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update players table with Farcaster data from auth.users metadata
  UPDATE players 
  SET 
    farcaster_fid = COALESCE(
      (auth_users.raw_user_meta_data->>'farcaster_fid')::INTEGER,
      (auth_users.raw_user_meta_data->>'fid')::INTEGER
    ),
    username = COALESCE(
      auth_users.raw_user_meta_data->>'username',
      auth_users.raw_user_meta_data->>'display_name',
      players.username
    ),
    avatar_url = COALESCE(
      auth_users.raw_user_meta_data->>'avatar_url',
      players.avatar_url
    ),
    updated_at = NOW()
  FROM auth.users auth_users
  WHERE players.user_id = auth_users.id 
    AND (
      auth_users.raw_user_meta_data->>'farcaster_fid' IS NOT NULL OR
      auth_users.raw_user_meta_data->>'fid' IS NOT NULL OR
      auth_users.raw_user_meta_data->>'username' IS NOT NULL
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Updated % existing users with Farcaster data', updated_count;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. EXECUTE CLEANUP FUNCTIONS
-- ============================================================================

-- Sync existing user emails
SELECT sync_existing_user_emails();

-- Update existing Farcaster users
SELECT update_existing_farcaster_users();

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.sync_existing_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_existing_farcaster_users() TO authenticated;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Check the current state of the players table
DO $$
BEGIN
  RAISE NOTICE '=== PLAYERS TABLE STATUS ===';
  RAISE NOTICE 'Total players: %', (SELECT COUNT(*) FROM players);
  RAISE NOTICE 'Players with email: %', (SELECT COUNT(*) FROM players WHERE email IS NOT NULL);
  RAISE NOTICE 'Players with farcaster_fid: %', (SELECT COUNT(*) FROM players WHERE farcaster_fid IS NOT NULL);
  RAISE NOTICE 'Players with username: %', (SELECT COUNT(*) FROM players WHERE username IS NOT NULL);
  RAISE NOTICE 'Players with avatar_url: %', (SELECT COUNT(*) FROM players WHERE avatar_url IS NOT NULL);
END $$;

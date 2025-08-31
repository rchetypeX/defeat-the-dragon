-- Comprehensive fix for wallet signup bugs
-- This script addresses all the critical issues preventing proper wallet signup

-- 1. Add missing columns to players table
DO $$
BEGIN
    -- Add needsAdventurerName column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'needsAdventurerName') THEN
        ALTER TABLE players ADD COLUMN "needsAdventurerName" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✅ Added needsAdventurerName column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ needsAdventurerName column already exists';
    END IF;
    
    -- Add wallet_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'wallet_address') THEN
        ALTER TABLE players ADD COLUMN wallet_address VARCHAR(42) UNIQUE;
        RAISE NOTICE '✅ Added wallet_address column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ wallet_address column already exists';
    END IF;
    
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'display_name') THEN
        ALTER TABLE players ADD COLUMN display_name VARCHAR(50);
        RAISE NOTICE '✅ Added display_name column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ display_name column already exists';
    END IF;
END $$;

-- 2. Fix existing users with incorrect starting values
UPDATE players 
SET 
    coins = 0,
    sparks = 0,
    "needsAdventurerName" = true
WHERE 
    (coins = 100 OR sparks = 50) 
    AND "needsAdventurerName" IS NULL;

-- Report how many users were fixed
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE '✅ Fixed % users with incorrect starting values', fixed_count;
END $$;

-- 3. Update the handle_new_user function to use correct values
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

-- 4. Ensure the trigger exists and is working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 6. Fix existing users who need to set their adventurer name
UPDATE players 
SET "needsAdventurerName" = true
WHERE 
    display_name IS NULL 
    OR display_name = 'Adventurer' 
    OR display_name LIKE 'Player_%';

-- Report how many users need to set their name
DO $$
DECLARE
    needs_name_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO needs_name_count
    FROM players 
    WHERE "needsAdventurerName" = true;
    
    RAISE NOTICE 'ℹ️ % users need to set their adventurer name', needs_name_count;
END $$;

-- 7. Verify the current state
DO $$
DECLARE
    total_users INTEGER;
    wallet_users INTEGER;
    needs_name_users INTEGER;
    incorrect_coins_users INTEGER;
    incorrect_sparks_users INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM players;
    
    -- Count wallet users
    SELECT COUNT(*) INTO wallet_users FROM players WHERE wallet_address IS NOT NULL;
    
    -- Count users who need to set their name
    SELECT COUNT(*) INTO needs_name_users FROM players WHERE "needsAdventurerName" = true;
    
    -- Count users with incorrect starting values
    SELECT COUNT(*) INTO incorrect_coins_users FROM players WHERE coins = 100;
    SELECT COUNT(*) INTO incorrect_sparks_users FROM players WHERE sparks = 50;
    
    RAISE NOTICE '📊 Current Status:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Wallet users: %', wallet_users;
    RAISE NOTICE '   Need to set name: %', needs_name_users;
    RAISE NOTICE '   Still have 100 coins: %', incorrect_coins_users;
    RAISE NOTICE '   Still have 50 sparks: %', incorrect_sparks_users;
    
    IF incorrect_coins_users > 0 OR incorrect_sparks_users > 0 THEN
        RAISE NOTICE '⚠️ Some users still have incorrect starting values - run this script again';
    ELSE
        RAISE NOTICE '✅ All users have correct starting values';
    END IF;
END $$;

-- 8. Show sample of users who need to set their name
SELECT 
    user_id,
    display_name,
    wallet_address,
    coins,
    sparks,
    "needsAdventurerName"
FROM players 
WHERE "needsAdventurerName" = true
LIMIT 5;

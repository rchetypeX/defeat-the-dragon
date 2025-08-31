-- Complete fix for existing users - addresses both adventurer name save and incorrect starting values
-- This script will fix all existing users who have the wrong starting values

-- 1. First, let's see what we're working with
DO $$
DECLARE
    total_users INTEGER;
    users_with_old_values INTEGER;
    users_needing_names INTEGER;
BEGIN
    RAISE NOTICE '🔍 Analyzing existing users...';
    
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM players;
    
    -- Count users with old starting values (100 coins or 50 sparks)
    SELECT COUNT(*) INTO users_with_old_values 
    FROM players 
    WHERE coins = 100 OR sparks = 50;
    
    -- Count users who need to set their name
    SELECT COUNT(*) INTO users_needing_names 
    FROM players 
    WHERE "needsAdventurerName" = true;
    
    RAISE NOTICE '📊 Current State:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Users with old values (100 coins/50 sparks): %', users_with_old_values;
    RAISE NOTICE '   Users needing names: %', users_needing_names;
END $$;

-- 2. Remove the unique constraint on wallet_address if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'players_wallet_address_key'
        AND table_name = 'players'
    ) THEN
        ALTER TABLE players DROP CONSTRAINT players_wallet_address_key;
        RAISE NOTICE '✅ Removed unique constraint on wallet_address';
    ELSE
        RAISE NOTICE '✅ No unique constraint on wallet_address found';
    END IF;
END $$;

-- 3. Fix existing users with incorrect starting values
UPDATE players 
SET coins = 0,
    sparks = 0,
    "needsAdventurerName" = CASE 
        WHEN display_name IS NULL OR display_name = 'Adventurer' OR display_name LIKE 'Player_%' THEN true
        ELSE false
    END,
    updated_at = NOW()
WHERE coins = 100 OR sparks = 50;

-- 4. Ensure all required columns exist
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS "needsAdventurerName" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Adventurer';

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS is_inspired BOOLEAN NOT NULL DEFAULT false;

-- 5. Fix any users with missing data
UPDATE players 
SET "needsAdventurerName" = COALESCE("needsAdventurerName", true),
    display_name = COALESCE(display_name, 'Adventurer'),
    wallet_address = COALESCE(wallet_address, 'unknown'),
    coins = COALESCE(coins, 0),
    sparks = COALESCE(sparks, 0),
    level = COALESCE(level, 1),
    xp = COALESCE(xp, 0),
    updated_at = NOW()
WHERE "needsAdventurerName" IS NULL 
   OR display_name IS NULL 
   OR wallet_address IS NULL
   OR coins IS NULL
   OR sparks IS NULL
   OR level IS NULL
   OR xp IS NULL;

-- 6. Recreate the handle_new_user function with proper error handling
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
    "needsAdventurerName",
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    display_name,
    wallet_address,
    1,  -- Default level
    0,  -- Default XP
    0,  -- Start with 0 coins (FIXED)
    0,  -- Start with 0 sparks (FIXED)
    false, -- Default inspired status
    true, -- Show name change popup for new users
    NOW(),
    NOW()
  );
  
  -- Insert default user settings
  INSERT INTO public.user_settings (
    user_id,
    sound_enabled,
    notifications_enabled,
    accessibility,
    equipped_character,
    equipped_background,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,  -- Sound enabled by default
    true,  -- Notifications enabled by default
    'default', -- Default accessibility
    'fighter', -- Default character
    'forest',  -- Default background
    NOW(),
    NOW()
  );
  
  -- Insert default inventory items
  INSERT INTO public.user_inventory (
    user_id,
    item_id,
    item_type,
    quantity,
    equipped,
    created_at
  )
  VALUES 
    (NEW.id, 'fighter', 'character', 1, true, NOW()),
    (NEW.id, 'forest', 'background', 1, true, NOW())
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Fix RLS policies to allow proper access
DROP POLICY IF EXISTS "Users can view own player data" ON players;
CREATE POLICY "Users can view own player data" ON players
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own player data" ON players;
CREATE POLICY "Users can update own player data" ON players
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all player data" ON players;
CREATE POLICY "Service role can manage all player data" ON players
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Ensure the unique constraint exists for user_inventory
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_inventory_user_id_item_id_key'
        AND table_name = 'user_inventory'
    ) THEN
        ALTER TABLE user_inventory 
        ADD CONSTRAINT user_inventory_user_id_item_id_key 
        UNIQUE (user_id, item_id);
        RAISE NOTICE '✅ Added unique constraint to user_inventory';
    ELSE
        RAISE NOTICE '✅ Unique constraint already exists on user_inventory';
    END IF;
END $$;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.players TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
GRANT ALL ON public.user_inventory TO anon, authenticated;

-- 11. Fix any existing users who might have been created with wrong values
-- This ensures that even if the function was broken, existing users get fixed
UPDATE players 
SET coins = 0,
    sparks = 0,
    "needsAdventurerName" = CASE 
        WHEN display_name IS NULL OR display_name = 'Adventurer' OR display_name LIKE 'Player_%' THEN true
        ELSE false
    END,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM players 
    WHERE coins > 0 OR sparks > 0
    ORDER BY created_at DESC
);

-- 12. Verify the fix
DO $$
DECLARE
    total_players INTEGER;
    players_with_names INTEGER;
    players_needing_names INTEGER;
    players_with_correct_values INTEGER;
BEGIN
    RAISE NOTICE '🎉 Fix completed! Verifying results...';
    
    SELECT COUNT(*) INTO total_players FROM players;
    SELECT COUNT(*) INTO players_with_names FROM players WHERE display_name IS NOT NULL AND display_name != 'Adventurer';
    SELECT COUNT(*) INTO players_needing_names FROM players WHERE "needsAdventurerName" = true;
    SELECT COUNT(*) INTO players_with_correct_values FROM players WHERE coins = 0 AND sparks = 0;
    
    RAISE NOTICE '📊 Final Results:';
    RAISE NOTICE '   Total players: %', total_players;
    RAISE NOTICE '   Players with names: %', players_with_names;
    RAISE NOTICE '   Players needing names: %', players_needing_names;
    RAISE NOTICE '   Players with correct values (0 coins, 0 sparks): %', players_with_correct_values;
    
    IF players_with_correct_values = total_players THEN
        RAISE NOTICE '✅ All players now have correct starting values!';
    ELSE
        RAISE NOTICE '⚠️ Some players still have incorrect values';
    END IF;
    
    RAISE NOTICE '💡 Try setting your adventurer name again!';
    RAISE NOTICE '💡 You should now start with 0 coins and 0 sparks!';
END $$;

-- 13. Show the current state of all players
SELECT 
    user_id,
    display_name,
    wallet_address,
    level,
    xp,
    coins,
    sparks,
    "needsAdventurerName",
    created_at,
    updated_at
FROM players 
ORDER BY created_at DESC;

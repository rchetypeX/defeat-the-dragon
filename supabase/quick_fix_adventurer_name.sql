-- Quick fix for adventurer name save issue
-- This script addresses common problems that prevent name updates

-- 1. First, let's check the current state
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    column_name TEXT;
BEGIN
    RAISE NOTICE '🔍 Checking for missing columns...';
    
    -- Check for required columns
    FOR column_name IN 
        SELECT unnest(ARRAY['needsAdventurerName', 'wallet_address', 'display_name'])
    LOOP
        IF NOT EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name = column_name
        ) THEN
            missing_columns := array_append(missing_columns, column_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist';
    END IF;
END $$;

-- 2. Add missing columns if they don't exist
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS "needsAdventurerName" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Adventurer';

-- 3. Ensure the handle_new_user function exists and is correct
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
    0,  -- Start with 0 coins
    0,  -- Start with 0 sparks
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix RLS policies to allow proper access
DROP POLICY IF EXISTS "Users can view own player data" ON players;
CREATE POLICY "Users can view own player data" ON players
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own player data" ON players;
CREATE POLICY "Users can update own player data" ON players
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all player data" ON players;
CREATE POLICY "Service role can manage all player data" ON players
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Fix any existing users who might have missing data
UPDATE players 
SET "needsAdventurerName" = true,
    display_name = COALESCE(display_name, 'Adventurer'),
    wallet_address = COALESCE(wallet_address, 'unknown'),
    updated_at = NOW()
WHERE "needsAdventurerName" IS NULL 
   OR display_name IS NULL 
   OR wallet_address IS NULL;

-- 7. Ensure the unique constraint exists for user_inventory
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

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.players TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
GRANT ALL ON public.user_inventory TO anon, authenticated;

-- 9. Verify the fix
DO $$
DECLARE
    total_players INTEGER;
    players_with_names INTEGER;
    players_needing_names INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_players FROM players;
    SELECT COUNT(*) INTO players_with_names FROM players WHERE display_name IS NOT NULL AND display_name != 'Adventurer';
    SELECT COUNT(*) INTO players_needing_names FROM players WHERE "needsAdventurerName" = true;
    
    RAISE NOTICE '🎉 Fix completed!';
    RAISE NOTICE '   Total players: %', total_players;
    RAISE NOTICE '   Players with names: %', players_with_names;
    RAISE NOTICE '   Players needing names: %', players_needing_names;
    RAISE NOTICE '💡 Try setting your adventurer name again!';
END $$;

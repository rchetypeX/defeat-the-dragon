-- Comprehensive fix for shop purchase authentication
-- This script ensures all users have proper player records and the shop can authenticate them

-- 1. First, let's check what users are missing player records
SELECT 
  'Users without player records:' as info,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 2. Create missing player records for existing users
INSERT INTO players (
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
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', 'Adventurer'),
  u.raw_user_meta_data->>'wallet_address',
  1,  -- Default level
  0,  -- Default XP
  0,  -- Start with 0 coins
  0,  -- Start with 0 sparks
  false, -- Default inspired status
  true, -- Show name change popup for new users
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 3. Ensure all required columns exist in players table
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'needsAdventurerName') THEN
        ALTER TABLE players ADD COLUMN "needsAdventurerName" BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '✅ Added needsAdventurerName column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'wallet_address') THEN
        ALTER TABLE players ADD COLUMN wallet_address VARCHAR(42) UNIQUE;
        RAISE NOTICE '✅ Added wallet_address column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'display_name') THEN
        ALTER TABLE players ADD COLUMN display_name VARCHAR(50);
        RAISE NOTICE '✅ Added display_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'is_inspired') THEN
        ALTER TABLE players ADD COLUMN is_inspired BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✅ Added is_inspired column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'updated_at') THEN
        ALTER TABLE players ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
    END IF;
END $$;

-- 4. Fix the handle_new_user function to be robust and handle all user types
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
  
  -- Create default user settings if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Add default inventory items if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_inventory') THEN
    INSERT INTO public.user_inventory (user_id, item_id, item_type, equipped)
    VALUES 
      (NEW.id, 'fighter', 'character', true),
      (NEW.id, 'forest', 'background', true)
    ON CONFLICT (user_id, item_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure the trigger exists and is working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 7. Create function to update player timestamp
CREATE OR REPLACE FUNCTION update_players_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_players_timestamp_trigger ON players;
CREATE TRIGGER update_players_timestamp_trigger
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_players_timestamp();

-- 9. Ensure RLS policies allow proper access to players table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own player data" ON players;
    DROP POLICY IF EXISTS "Users can update own player data" ON players;
    DROP POLICY IF EXISTS "Users can view players by wallet address" ON players;
    
    -- Create comprehensive policies
    CREATE POLICY "Users can view own player data" ON players
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own player data" ON players
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can view players by wallet address" ON players
      FOR SELECT USING (auth.uid() = user_id OR wallet_address IS NOT NULL);
END $$;

-- 10. Verify the fix worked
SELECT 
  'Users with player records after fix:' as info,
  COUNT(*) as count
FROM players;

-- 11. Show any remaining issues
SELECT 
  'Users still without player records:' as info,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 12. Show sample of fixed users
SELECT 
  'Sample of fixed users:' as info,
  p.user_id,
  p.display_name,
  p.coins,
  p.sparks
FROM players p
ORDER BY p.created_at DESC
LIMIT 5;

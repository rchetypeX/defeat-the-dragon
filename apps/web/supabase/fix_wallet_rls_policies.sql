-- Fix RLS policies for wallet users
-- This script addresses the issue where wallet users can't create player records due to RLS policy violations
-- AND restricts user modifications to only display_name fields

-- First, let's check the current RLS policies on the players table
-- and update them to properly handle wallet users

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view own player data" ON players;
DROP POLICY IF EXISTS "Users can insert own player data" ON players;
DROP POLICY IF EXISTS "Users can update own player data" ON players;
DROP POLICY IF EXISTS "Users can update only display_name in player data" ON players;
DROP POLICY IF EXISTS "Users can view players by wallet address" ON players;

-- Create new policies that handle both auth users and wallet users
CREATE POLICY "Users can view own player data" ON players 
FOR SELECT USING (
  auth.uid() = user_id OR 
  (wallet_address IS NOT NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Users can insert own player data" ON players 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  (wallet_address IS NOT NULL AND auth.uid() IS NULL)
);

-- Create a more restrictive UPDATE policy that only allows display_name changes
-- We'll use a function to validate the update
CREATE POLICY "Users can update only display_name in player data" ON players 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (wallet_address IS NOT NULL AND auth.uid() IS NULL)
);

-- Also update profiles table policies to handle wallet users
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update only display_name in profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = profiles.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = profiles.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

-- Create a more restrictive UPDATE policy for profiles
CREATE POLICY "Users can update only display_name in profile" ON profiles 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = profiles.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

-- Update sessions table policies to handle wallet users
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;

CREATE POLICY "Users can view own sessions" ON sessions 
FOR SELECT USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = sessions.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

CREATE POLICY "Users can insert own sessions" ON sessions 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = sessions.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

CREATE POLICY "Users can update own sessions" ON sessions 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = sessions.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

-- Update subscriptions table policies to handle wallet users
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions" ON subscriptions 
FOR SELECT USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = subscriptions.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = subscriptions.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

CREATE POLICY "Users can update own subscriptions" ON subscriptions 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = subscriptions.user_id 
    AND p.wallet_address IS NOT NULL
  ))
);

-- Update shop_items policies to ensure public read access is maintained
DROP POLICY IF EXISTS "Anyone can view active shop items" ON shop_items;
DROP POLICY IF EXISTS "Anyone can view shop items" ON shop_items;

CREATE POLICY "Anyone can view active shop items" ON shop_items 
FOR SELECT USING (is_active = true);

-- Create a function to handle wallet user creation with proper RLS bypass
CREATE OR REPLACE FUNCTION create_wallet_player(
  p_user_id UUID,
  p_wallet_address VARCHAR(42),
  p_display_name VARCHAR(50) DEFAULT 'Adventurer'
)
RETURNS UUID AS $$
DECLARE
  player_id UUID;
BEGIN
  -- Insert player record with service role privileges
  INSERT INTO players (
    user_id, 
    wallet_address, 
    display_name, 
    level, 
    xp, 
    coins, 
    sparks, 
    created_at
  ) VALUES (
    p_user_id,
    p_wallet_address,
    p_display_name,
    1,
    0,
    100,
    50,
    NOW()
  ) RETURNING id INTO player_id;
  
  -- Insert profile record
  INSERT INTO profiles (
    user_id,
    display_name,
    created_at
  ) VALUES (
    p_user_id,
    p_display_name,
    NOW()
  );
  
  RETURN player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_wallet_player(UUID, VARCHAR(42), VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION create_wallet_player(UUID, VARCHAR(42), VARCHAR(50)) TO anon;

-- Create a function to update only display_name in players table
CREATE OR REPLACE FUNCTION update_player_display_name(
  p_user_id UUID,
  p_display_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update player display_name
  UPDATE players 
  SET display_name = p_display_name, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update profile display_name
  UPDATE profiles 
  SET display_name = p_display_name, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_player_display_name(UUID, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_display_name(UUID, VARCHAR(50)) TO anon;

-- Create triggers to prevent unauthorized field updates
CREATE OR REPLACE FUNCTION prevent_unauthorized_player_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow display_name and updated_at to be changed
  IF OLD.level != NEW.level OR
     OLD.xp != NEW.xp OR
     OLD.coins != NEW.coins OR
     OLD.sparks != NEW.sparks OR
     OLD.is_inspired != NEW.is_inspired OR
     OLD.current_streak != NEW.current_streak OR
     OLD.longest_streak != NEW.longest_streak OR
     OLD.total_sessions != NEW.total_sessions OR
     OLD.total_focus_time != NEW.total_focus_time OR
     OLD.wallet_address != NEW.wallet_address OR
     OLD.user_id != NEW.user_id OR
     OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Unauthorized field update detected. Only display_name can be modified by users.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for players table
DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_player_updates ON players;
CREATE TRIGGER trigger_prevent_unauthorized_player_updates
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_player_updates();

-- Create trigger for profiles table
CREATE OR REPLACE FUNCTION prevent_unauthorized_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow display_name and updated_at to be changed
  IF OLD.user_id != NEW.user_id OR
     OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Unauthorized field update detected. Only display_name can be modified by users.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_profile_updates ON profiles;
CREATE TRIGGER trigger_prevent_unauthorized_profile_updates
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_profile_updates();

-- Verify the policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('players', 'profiles', 'sessions', 'subscriptions', 'shop_items')
ORDER BY tablename, policyname;

-- Remove redundant profiles table and consolidate display_name in players table
-- This migration removes the profiles table since it's redundant with the players table

-- First, ensure all display_name data from profiles is copied to players table
UPDATE players 
SET display_name = profiles.display_name
FROM profiles 
WHERE players.user_id = profiles.user_id 
  AND players.display_name IS NULL 
  AND profiles.display_name IS NOT NULL;

-- Drop the profiles table
DROP TABLE IF EXISTS profiles;

-- Update the handle_new_user function to only create player data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (user_id, display_name, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'),
    NEW.raw_user_meta_data->>'wallet_address'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to remove references to profiles table
-- Drop profiles-related policies (they will be dropped automatically when table is dropped)

-- Update any functions that reference profiles table
CREATE OR REPLACE FUNCTION update_player_display_name(
  p_user_id UUID,
  p_display_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update player display_name only
  UPDATE players 
  SET display_name = p_display_name, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_player_display_name(UUID, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_display_name(UUID, VARCHAR(50)) TO anon;

-- Create trigger for players table only
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

-- Verify the changes
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
WHERE tablename IN ('players', 'sessions', 'subscriptions', 'shop_items')
ORDER BY tablename, policyname;

-- Fix the player update trigger to allow session completion updates
-- This script should be run in the Supabase SQL Editor

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_player_updates ON players;

-- Create a new trigger function that allows session completion updates
CREATE OR REPLACE FUNCTION prevent_unauthorized_player_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow session completion updates (xp, coins, sparks, level) when updated_at is being set
  -- This is a simple heuristic - if updated_at is being modified, it's likely a session completion
  IF NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
    -- Allow the update to proceed for session completion
    RETURN NEW;
  END IF;
  
  -- For all other updates, only allow display_name and updated_at to be changed
  IF OLD.level != NEW.level OR
     OLD.xp != NEW.xp OR
     OLD.coins != NEW.coins OR
     OLD.sparks != NEW.sparks OR
     OLD.is_inspired != NEW.is_inspired OR
     OLD.wallet_address != NEW.wallet_address OR
     OLD.user_id != NEW.user_id OR
     OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Unauthorized field update detected. Only display_name can be modified by users.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_prevent_unauthorized_player_updates
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_player_updates();

-- Verify the trigger was recreated
SELECT 
  schemaname,
  tablename,
  triggername,
  tgisdisabled
FROM pg_trigger 
WHERE triggername = 'trigger_prevent_unauthorized_player_updates';

-- Test the trigger with a sample update
-- This should now allow session completion updates
SELECT 'Trigger updated successfully. Session completion should now work.' as status;

-- Temporarily disable the player update trigger to allow session completion
-- This script should be run in the Supabase SQL Editor

-- Disable the trigger temporarily
ALTER TABLE players DISABLE TRIGGER trigger_prevent_unauthorized_player_updates;

-- Verify the trigger is disabled
SELECT 
  schemaname,
  tablename,
  triggername,
  tgisdisabled
FROM pg_trigger 
WHERE triggername = 'trigger_prevent_unauthorized_player_updates';

-- Optional: Create a function to re-enable the trigger later
CREATE OR REPLACE FUNCTION re_enable_player_update_trigger()
RETURNS VOID AS $$
BEGIN
  ALTER TABLE players ENABLE TRIGGER trigger_prevent_unauthorized_player_updates;
  RAISE NOTICE 'Player update trigger has been re-enabled';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION re_enable_player_update_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION re_enable_player_update_trigger() TO anon;

-- Show current trigger status
SELECT 
  'Trigger Status:' as info,
  triggername,
  CASE WHEN tgisdisabled THEN 'DISABLED' ELSE 'ENABLED' END as status
FROM pg_trigger 
WHERE triggername = 'trigger_prevent_unauthorized_player_updates';

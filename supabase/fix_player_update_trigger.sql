-- Fix the player update trigger to only check fields that actually exist
-- This prevents the trigger from failing when trying to compare removed fields

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_player_updates ON players;

-- Create a new trigger function that only checks existing fields
CREATE OR REPLACE FUNCTION prevent_unauthorized_player_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow display_name and updated_at to be changed
  -- Only check fields that actually exist in the current schema
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

-- Also ensure the updated_at column exists and has a trigger
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_players_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_players_timestamp_trigger ON players;
CREATE TRIGGER update_players_timestamp_trigger
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_players_timestamp();

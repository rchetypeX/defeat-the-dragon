-- Add updated_at column to players table if it doesn't exist
-- This is used by the new session completion endpoint

DO $$ 
BEGIN
  -- Check if the column doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'players' 
    AND column_name = 'updated_at'
  ) THEN
    -- Add the column
    ALTER TABLE players ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Create an index for performance
    CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players(updated_at);
    
    -- Create a trigger to automatically update the updated_at column
    CREATE OR REPLACE FUNCTION update_players_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Create the trigger
    CREATE TRIGGER trigger_update_players_updated_at
      BEFORE UPDATE ON players
      FOR EACH ROW
      EXECUTE FUNCTION update_players_updated_at();
      
    RAISE NOTICE 'Added updated_at column to players table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in players table';
  END IF;
END $$;

-- Migration to add is_inspired column to players table
-- This tracks whether a user has an active Inspiration Boon subscription

-- Add is_inspired column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS is_inspired BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at column if it doesn't exist
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance when checking inspired status
CREATE INDEX IF NOT EXISTS idx_players_is_inspired ON players(is_inspired);

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

-- Add RLS policies for user_subscriptions table if they don't exist
DO $$
BEGIN
  -- Check if policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Users can insert own subscriptions'
  ) THEN
    CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Users can update own subscriptions'
  ) THEN
    CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

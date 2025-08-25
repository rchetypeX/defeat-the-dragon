-- Migration to restore is_inspired column to players table
-- This field is needed for subscription functionality to unlock Sparks rewards

-- Add is_inspired column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS is_inspired BOOLEAN NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_players_is_inspired ON players(is_inspired);

-- Add comment to document the purpose
COMMENT ON COLUMN players.is_inspired IS 'Indicates if player has active subscription to unlock Sparks rewards';

-- Remove shelved feature fields from players table
-- This migration removes bond_score, mood_state, and day_streak fields
-- that were part of a feature that was shelved

-- Remove the shelved feature columns from players table
ALTER TABLE players 
DROP COLUMN IF EXISTS bond_score,
DROP COLUMN IF EXISTS mood_state,
DROP COLUMN IF EXISTS day_streak;

-- Update the players table to only include active features
-- The table should now only have: id, user_id, level, xp, coins, sparks, is_inspired, created_at

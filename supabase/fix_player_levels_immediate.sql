-- Fix Player Levels - Immediate Fix
-- This script recalculates all player levels using the correct database-driven level progression system

-- First, let's check the current state
SELECT 
  'CURRENT STATE' as status,
  user_id,
  level,
  xp,
  updated_at
FROM players 
ORDER BY xp DESC
LIMIT 10;

-- Create a function to calculate level based on XP using the level_progression_master table
CREATE OR REPLACE FUNCTION calculate_player_level(p_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  calculated_level INTEGER := 1;
BEGIN
  -- Find the highest level where cumulative XP is less than or equal to current XP
  SELECT COALESCE(MAX(level), 1) INTO calculated_level
  FROM level_progression_master 
  WHERE cumulative_xp <= p_xp 
    AND is_active = true;
  
  RETURN calculated_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_player_level(INTEGER) TO authenticated;

-- Show what levels should be calculated for each player
SELECT 
  'LEVEL CALCULATION' as status,
  user_id,
  level as current_level,
  xp,
  calculate_player_level(xp) as correct_level,
  (calculate_player_level(xp) != level) as needs_update
FROM players 
ORDER BY xp DESC;

-- Update all players with correct levels
UPDATE players 
SET 
  level = calculate_player_level(players.xp),
  updated_at = NOW()
WHERE level != calculate_player_level(players.xp);

-- Show the results after the fix
SELECT 
  'AFTER FIX' as status,
  user_id,
  level,
  xp,
  updated_at
FROM players 
ORDER BY xp DESC
LIMIT 10;

-- Show level distribution
SELECT 
  'LEVEL DISTRIBUTION' as status,
  level,
  COUNT(*) as player_count,
  MIN(xp) as min_xp,
  MAX(xp) as max_xp,
  AVG(xp) as avg_xp
FROM players 
GROUP BY level 
ORDER BY level;

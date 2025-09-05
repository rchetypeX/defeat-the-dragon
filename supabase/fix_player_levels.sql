-- Fix Player Levels
-- This script recalculates all player levels using the new database-driven level progression system
-- instead of the old hardcoded system that was causing incorrect level calculations

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

-- Create a function to update all player levels
CREATE OR REPLACE FUNCTION fix_all_player_levels()
RETURNS TABLE(
  user_id UUID,
  old_level INTEGER,
  new_level INTEGER,
  xp INTEGER,
  level_changed BOOLEAN
) AS $$
BEGIN
  -- Update all players with correct levels and return the changes
  RETURN QUERY
  UPDATE players 
  SET 
    level = calculate_player_level(players.xp),
    updated_at = NOW()
  FROM (
    SELECT 
      p.user_id,
      p.level as old_level,
      p.xp,
      calculate_player_level(p.xp) as new_level
    FROM players p
  ) level_calc
  WHERE players.user_id = level_calc.user_id
  RETURNING 
    players.user_id,
    level_calc.old_level,
    players.level as new_level,
    players.xp,
    (players.level != level_calc.old_level) as level_changed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_player_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_all_player_levels() TO authenticated;

-- Show current level distribution before fix
SELECT 
  'BEFORE FIX' as status,
  level,
  COUNT(*) as player_count,
  MIN(xp) as min_xp,
  MAX(xp) as max_xp,
  AVG(xp) as avg_xp
FROM players 
GROUP BY level 
ORDER BY level;

-- Apply the fix
SELECT * FROM fix_all_player_levels();

-- Show level distribution after fix
SELECT 
  'AFTER FIX' as status,
  level,
  COUNT(*) as player_count,
  MIN(xp) as min_xp,
  MAX(xp) as max_xp,
  AVG(xp) as avg_xp
FROM players 
GROUP BY level 
ORDER BY level;

-- Show specific players who had level changes
SELECT 
  p.user_id,
  p.display_name,
  p.xp,
  p.level,
  'Level corrected' as note
FROM players p
WHERE p.xp >= 50 AND p.level = 1  -- Players with 50+ XP who should be level 2+
ORDER BY p.xp DESC;

-- Clean up temporary functions (optional - comment out if you want to keep them)
-- DROP FUNCTION IF EXISTS calculate_player_level(INTEGER);
-- DROP FUNCTION IF EXISTS fix_all_player_levels();

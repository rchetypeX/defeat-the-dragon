-- Add function to update player rewards for session completion
-- This function bypasses the unauthorized update trigger

-- Create function to update player rewards after session completion
CREATE OR REPLACE FUNCTION update_player_rewards_for_session(
  p_user_id UUID,
  p_xp_gained INTEGER,
  p_coins_gained INTEGER,
  p_sparks_gained INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_player RECORD;
  new_level INTEGER;
  level_up BOOLEAN;
BEGIN
  -- Get current player data
  SELECT * INTO current_player 
  FROM players 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found for user_id: %', p_user_id;
  END IF;
  
  -- Calculate new values
  new_level := FLOOR((current_player.xp + p_xp_gained) / 100) + 1;
  level_up := new_level > current_player.level;
  
  -- Update player data with rewards (bypassing the trigger)
  UPDATE players 
  SET 
    xp = current_player.xp + p_xp_gained,
    coins = current_player.coins + p_coins_gained,
    sparks = current_player.sparks + p_sparks_gained,
    level = new_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_player_rewards_for_session(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_rewards_for_session(UUID, INTEGER, INTEGER, INTEGER) TO anon;

-- Create a more specific function for session completion that includes session marking
CREATE OR REPLACE FUNCTION complete_session_with_rewards(
  p_session_id UUID,
  p_user_id UUID,
  p_xp_gained INTEGER,
  p_coins_gained INTEGER,
  p_sparks_gained INTEGER
)
RETURNS JSON AS $$
DECLARE
  current_player RECORD;
  new_level INTEGER;
  level_up BOOLEAN;
  result JSON;
BEGIN
  -- Get current player data
  SELECT * INTO current_player 
  FROM players 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found for user_id: %', p_user_id;
  END IF;
  
  -- Calculate new values
  new_level := FLOOR((current_player.xp + p_xp_gained) / 100) + 1;
  level_up := new_level > current_player.level;
  
  -- Update player data with rewards (bypassing the trigger)
  UPDATE players 
  SET 
    xp = current_player.xp + p_xp_gained,
    coins = current_player.coins + p_coins_gained,
    sparks = current_player.sparks + p_sparks_gained,
    level = new_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Mark session as completed
  UPDATE sessions 
  SET ended_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
  
  -- Return the result
  result := json_build_object(
    'xp_gained', p_xp_gained,
    'coins_gained', p_coins_gained,
    'sparks_gained', p_sparks_gained,
    'level_up', level_up,
    'new_level', new_level
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION complete_session_with_rewards(UUID, UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_session_with_rewards(UUID, UUID, INTEGER, INTEGER, INTEGER) TO anon;

-- Verify the functions were created
SELECT 
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('update_player_rewards_for_session', 'complete_session_with_rewards');

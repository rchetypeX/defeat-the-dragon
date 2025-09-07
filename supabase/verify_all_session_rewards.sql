-- Verify all session rewards data exists in the table
-- This will show all available session types and durations

-- Show all session types and their durations
SELECT 
  session_type,
  duration_minutes,
  base_xp,
  base_coins,
  base_sparks,
  bonus_multiplier
FROM session_rewards_master 
ORDER BY session_type, duration_minutes;

-- Count records by session type
SELECT 
  session_type,
  COUNT(*) as record_count,
  MIN(duration_minutes) as min_duration,
  MAX(duration_minutes) as max_duration
FROM session_rewards_master 
GROUP BY session_type
ORDER BY session_type;

-- Test a few different durations to make sure they work
SELECT 'Testing 10-minute Train session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Train' AND duration_minutes = 10;

SELECT 'Testing 25-minute Eat session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Eat' AND duration_minutes = 25;

SELECT 'Testing 60-minute Bathe session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Bathe' AND duration_minutes = 60;

SELECT 'Testing 120-minute Adventure session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Adventure' AND duration_minutes = 120;

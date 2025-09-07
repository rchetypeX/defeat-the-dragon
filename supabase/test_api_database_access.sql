-- Test if the API can access the database properly
-- This will help identify if it's an environment variable or service role issue

-- Test 1: Check if the session_rewards_master table is accessible
SELECT 'Testing session_rewards_master access:' as test;
SELECT COUNT(*) as total_records FROM session_rewards_master;

-- Test 2: Test the exact query the API would make for a 5-minute Train session
SELECT 'Testing API reward query for 5-minute Train session:' as test;
SELECT 
  session_type, 
  duration_minutes, 
  base_xp, 
  base_coins, 
  base_sparks, 
  bonus_multiplier 
FROM session_rewards_master 
WHERE session_type = 'Train' 
  AND duration_minutes = 5 
  AND is_active = true;

-- Test 3: Test the query with the exact conditions the API uses
SELECT 'Testing API query with exact conditions:' as test;
SELECT 
  session_type, 
  duration_minutes, 
  base_xp, 
  base_coins, 
  base_sparks, 
  bonus_multiplier 
FROM session_rewards_master 
WHERE session_type = 'Train' 
  AND is_active = true 
  AND duration_minutes <= 5 
ORDER BY duration_minutes DESC 
LIMIT 1;

-- Test 4: Check if there are any RLS issues with session_rewards_master
SELECT 'Checking RLS policies on session_rewards_master:' as test;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'session_rewards_master';

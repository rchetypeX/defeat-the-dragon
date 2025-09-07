-- Fix duplicate RLS policies for session_rewards_master table
-- This script removes duplicate policies and ensures proper access

-- Remove duplicate policies
DROP POLICY IF EXISTS "Public read access for session rewards" ON session_rewards_master;
DROP POLICY IF EXISTS "Admin write access for session rewards" ON session_rewards_master;

-- Keep only the working policy
-- "Anyone can view session rewards" should remain

-- Verify the remaining policies
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

-- Test a simple query to make sure it works
SELECT COUNT(*) as total_records FROM session_rewards_master;

-- Test the specific query the API would make
SELECT 
  session_type, 
  duration_minutes, 
  base_xp, 
  base_coins, 
  base_sparks, 
  bonus_multiplier 
FROM session_rewards_master 
WHERE session_type = 'Train' AND duration_minutes = 5;

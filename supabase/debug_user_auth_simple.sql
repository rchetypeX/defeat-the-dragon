-- Simple diagnostic script to check user authentication and sync issues
-- This will help identify why the API is failing with 500 errors

-- First, let's check the table structures
SELECT 'Checking sessions table structure:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;

SELECT 'Checking players table structure:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- Check if the user exists in the players table
SELECT 'Checking players table data:' as status;
SELECT 
  id,
  wallet_address,
  display_name,
  level,
  xp,
  coins,
  sparks,
  created_at,
  updated_at
FROM players 
ORDER BY created_at DESC 
LIMIT 5;

-- Check RLS policies on players table
SELECT 'Checking RLS policies on players table:' as status;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'players';

-- Test a simple query that the API would make
SELECT 'Testing API query simulation:' as status;
-- This simulates what the API tries to do
SELECT 
  p.id,
  p.wallet_address,
  p.display_name,
  p.level,
  p.xp,
  p.coins,
  p.sparks
FROM players p
WHERE p.wallet_address = '0xf283f4fff884c70df8f731321ba76ec665f22ee7'
LIMIT 1;

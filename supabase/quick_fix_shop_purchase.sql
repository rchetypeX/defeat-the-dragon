-- Quick fix for shop purchase authentication
-- This creates missing player records for users who can't purchase items

-- 1. Check current status
SELECT 
  'Current status:' as info,
  COUNT(*) as total_users,
  COUNT(p.user_id) as users_with_player_records,
  COUNT(*) - COUNT(p.user_id) as users_missing_player_records
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id;

-- 2. Create missing player records for existing users
INSERT INTO players (
  user_id, 
  display_name, 
  wallet_address,
  level,
  xp,
  coins,
  sparks,
  is_inspired,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', 'Adventurer'),
  u.raw_user_meta_data->>'wallet_address',
  1,  -- Default level
  0,  -- Default XP
  0,  -- Start with 0 coins
  0,  -- Start with 0 sparks
  false, -- Default inspired status
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Ensure required columns exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS "needsAdventurerName" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE players ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);
ALTER TABLE players ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_inspired BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Verify the fix worked
SELECT 
  'After fix:' as info,
  COUNT(*) as total_users,
  COUNT(p.user_id) as users_with_player_records,
  COUNT(*) - COUNT(p.user_id) as users_missing_player_records
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id;

-- 5. Show sample of fixed users
SELECT 
  'Sample of users with player records:' as info,
  p.user_id,
  p.display_name,
  p.coins,
  p.sparks,
  p.created_at
FROM players p
ORDER BY p.created_at DESC
LIMIT 5;

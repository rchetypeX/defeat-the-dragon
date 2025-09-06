-- Populate Session Rewards Master Table
-- This script creates and populates the session_rewards_master table with proper reward data
-- to replace the hardcoded fallback rewards in the API

-- Create the session_rewards_master table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_rewards_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_type TEXT NOT NULL CHECK (session_type IN ('Train', 'Quest_Study', 'Learn', 'Search', 'Eat', 'Sleep', 'Bathe', 'Maintain', 'Fight', 'Adventure')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  base_xp INTEGER NOT NULL CHECK (base_xp >= 0),
  base_coins INTEGER NOT NULL CHECK (base_coins >= 0),
  base_sparks INTEGER NOT NULL CHECK (base_sparks >= 0),
  bonus_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (bonus_multiplier > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE session_rewards_master ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (public read access for session rewards)
CREATE POLICY "Anyone can view session rewards" ON session_rewards_master FOR SELECT USING (true);

-- Clear any existing data to ensure consistency
TRUNCATE TABLE session_rewards_master RESTART IDENTITY;

-- Insert session rewards data
-- These rewards are designed to be more balanced than the current fallback
-- Current fallback: XP = duration * 2, Coins = duration * 0.8, Sparks = duration * 0.2
-- New rewards: More reasonable progression with bonus multipliers for longer sessions

INSERT INTO session_rewards_master (session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier, is_active) VALUES

-- 5 minute sessions
('Train', 5, 8, 3, 1, 1.00, true),
('Quest_Study', 5, 10, 4, 1, 1.00, true),
('Learn', 5, 6, 2, 1, 1.00, true),
('Search', 5, 5, 2, 0, 1.00, true),
('Eat', 5, 3, 1, 0, 1.00, true),
('Sleep', 5, 2, 1, 0, 1.00, true),
('Bathe', 5, 4, 2, 0, 1.00, true),
('Maintain', 5, 5, 2, 1, 1.00, true),
('Fight', 5, 12, 5, 2, 1.00, true),
('Adventure', 5, 15, 6, 2, 1.00, true),

-- 10 minute sessions
('Train', 10, 15, 6, 2, 1.00, true),
('Quest_Study', 10, 18, 7, 2, 1.00, true),
('Learn', 10, 12, 4, 1, 1.00, true),
('Search', 10, 10, 4, 1, 1.00, true),
('Eat', 10, 6, 2, 1, 1.00, true),
('Sleep', 10, 4, 2, 0, 1.00, true),
('Bathe', 10, 8, 3, 1, 1.00, true),
('Maintain', 10, 10, 4, 1, 1.00, true),
('Fight', 10, 22, 9, 3, 1.00, true),
('Adventure', 10, 28, 11, 4, 1.00, true),

-- 15 minute sessions
('Train', 15, 22, 9, 3, 1.00, true),
('Quest_Study', 15, 26, 10, 3, 1.00, true),
('Learn', 15, 18, 6, 2, 1.00, true),
('Search', 15, 15, 6, 2, 1.00, true),
('Eat', 15, 9, 3, 1, 1.00, true),
('Sleep', 15, 6, 3, 1, 1.00, true),
('Bathe', 15, 12, 4, 1, 1.00, true),
('Maintain', 15, 15, 6, 2, 1.00, true),
('Fight', 15, 32, 13, 4, 1.00, true),
('Adventure', 15, 40, 16, 5, 1.00, true),

-- 20 minute sessions
('Train', 20, 28, 11, 4, 1.00, true),
('Quest_Study', 20, 34, 13, 4, 1.00, true),
('Learn', 20, 24, 8, 2, 1.00, true),
('Search', 20, 20, 8, 2, 1.00, true),
('Eat', 20, 12, 4, 1, 1.00, true),
('Sleep', 20, 8, 4, 1, 1.00, true),
('Bathe', 20, 16, 5, 2, 1.00, true),
('Maintain', 20, 20, 8, 2, 1.00, true),
('Fight', 20, 42, 17, 5, 1.00, true),
('Adventure', 20, 52, 20, 6, 1.00, true),

-- 25 minute sessions (your current session)
('Train', 25, 35, 14, 5, 1.00, true),
('Quest_Study', 25, 42, 16, 5, 1.00, true),
('Learn', 25, 30, 10, 3, 1.00, true),
('Search', 25, 25, 10, 3, 1.00, true),
('Eat', 25, 15, 5, 2, 1.00, true),
('Sleep', 25, 10, 5, 1, 1.00, true),
('Bathe', 25, 20, 6, 2, 1.00, true),
('Maintain', 25, 25, 10, 3, 1.00, true),
('Fight', 25, 52, 21, 6, 1.00, true),
('Adventure', 25, 65, 25, 8, 1.00, true),

-- 30 minute sessions
('Train', 30, 42, 17, 6, 1.00, true),
('Quest_Study', 30, 50, 19, 6, 1.00, true),
('Learn', 30, 36, 12, 3, 1.00, true),
('Search', 30, 30, 12, 3, 1.00, true),
('Eat', 30, 18, 6, 2, 1.00, true),
('Sleep', 30, 12, 6, 2, 1.00, true),
('Bathe', 30, 24, 7, 2, 1.00, true),
('Maintain', 30, 30, 12, 3, 1.00, true),
('Fight', 30, 62, 25, 7, 1.00, true),
('Adventure', 30, 78, 30, 9, 1.00, true),

-- 45 minute sessions
('Train', 45, 63, 25, 9, 1.00, true),
('Quest_Study', 45, 75, 28, 9, 1.00, true),
('Learn', 45, 54, 18, 5, 1.00, true),
('Search', 45, 45, 18, 5, 1.00, true),
('Eat', 45, 27, 9, 3, 1.00, true),
('Sleep', 45, 18, 9, 3, 1.00, true),
('Bathe', 45, 36, 11, 3, 1.00, true),
('Maintain', 45, 45, 18, 5, 1.00, true),
('Fight', 45, 93, 37, 11, 1.00, true),
('Adventure', 45, 117, 45, 14, 1.00, true),

-- 60 minute sessions
('Train', 60, 84, 34, 12, 1.00, true),
('Quest_Study', 60, 100, 38, 12, 1.00, true),
('Learn', 60, 72, 24, 6, 1.00, true),
('Search', 60, 60, 24, 6, 1.00, true),
('Eat', 60, 36, 12, 4, 1.00, true),
('Sleep', 60, 24, 12, 4, 1.00, true),
('Bathe', 60, 48, 14, 4, 1.00, true),
('Maintain', 60, 60, 24, 6, 1.00, true),
('Fight', 60, 124, 50, 14, 1.00, true),
('Adventure', 60, 156, 60, 18, 1.00, true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_rewards_type_duration ON session_rewards_master(session_type, duration_minutes);
CREATE INDEX IF NOT EXISTS idx_session_rewards_active ON session_rewards_master(is_active);

-- Verify the data was inserted correctly
SELECT 
  session_type,
  duration_minutes,
  base_xp,
  base_coins,
  base_sparks,
  bonus_multiplier
FROM session_rewards_master 
WHERE duration_minutes = 25
ORDER BY session_type;

-- Show comparison with current fallback rewards
SELECT 
  'Current Fallback (25 min)' as reward_type,
  50 as xp,
  20 as coins,
  5 as sparks
UNION ALL
SELECT 
  'New Train (25 min)' as reward_type,
  base_xp as xp,
  base_coins as coins,
  base_sparks as sparks
FROM session_rewards_master 
WHERE session_type = 'Train' AND duration_minutes = 25;

-- Count total session reward entries
SELECT COUNT(*) as total_session_rewards FROM session_rewards_master WHERE is_active = true;

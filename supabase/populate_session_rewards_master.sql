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
DROP POLICY IF EXISTS "Anyone can view session rewards" ON session_rewards_master;
CREATE POLICY "Anyone can view session rewards" ON session_rewards_master FOR SELECT USING (true);

-- Clear any existing data to ensure consistency
TRUNCATE TABLE session_rewards_master RESTART IDENTITY;

-- Insert session rewards data based on the exact table structure provided
-- Session types are determined by duration ranges:
-- 5-15: Train, 16-30: Eat, 31-45: Learn, 46-60: Bathe, 61-75: Sleep, 76-90: Maintain, 91-105: Fight, 106-120: Adventure

INSERT INTO session_rewards_master (session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier, is_active) VALUES

-- 5 minute sessions (Train)
('Train', 5, 5, 3, 0, 1.00, true),

-- 10 minute sessions (Train)
('Train', 10, 10, 6, 0, 1.00, true),

-- 15 minute sessions (Train)
('Train', 15, 16, 9, 1, 1.00, true),

-- 20 minute sessions (Eat)
('Eat', 20, 22, 13, 1, 1.00, true),

-- 25 minute sessions (Eat) - Your current session
('Eat', 25, 28, 16, 1, 1.00, true),

-- 30 minute sessions (Eat)
('Eat', 30, 34, 20, 2, 1.00, true),

-- 35 minute sessions (Learn)
('Learn', 35, 41, 24, 2, 1.00, true),

-- 40 minute sessions (Learn)
('Learn', 40, 48, 28, 2, 1.00, true),

-- 45 minute sessions (Learn)
('Learn', 45, 55, 33, 3, 1.00, true),

-- 50 minute sessions (Bathe)
('Bathe', 50, 62, 37, 3, 1.00, true),

-- 55 minute sessions (Bathe)
('Bathe', 55, 70, 42, 3, 1.00, true),

-- 60 minute sessions (Bathe)
('Bathe', 60, 78, 46, 4, 1.00, true),

-- 65 minute sessions (Sleep)
('Sleep', 65, 86, 51, 4, 1.00, true),

-- 70 minute sessions (Sleep)
('Sleep', 70, 94, 56, 4, 1.00, true),

-- 75 minute sessions (Sleep)
('Sleep', 75, 103, 61, 5, 1.00, true),

-- 80 minute sessions (Maintain)
('Maintain', 80, 112, 67, 5, 1.00, true),

-- 85 minute sessions (Maintain)
('Maintain', 85, 121, 72, 5, 1.00, true),

-- 90 minute sessions (Maintain)
('Maintain', 90, 130, 78, 6, 1.00, true),

-- 95 minute sessions (Fight)
('Fight', 95, 140, 84, 6, 1.00, true),

-- 100 minute sessions (Fight)
('Fight', 100, 150, 90, 6, 1.00, true),

-- 105 minute sessions (Fight)
('Fight', 105, 158, 94, 7, 1.00, true),

-- 110 minute sessions (Adventure)
('Adventure', 110, 165, 99, 7, 1.00, true),

-- 115 minute sessions (Adventure)
('Adventure', 115, 172, 103, 7, 1.00, true),

-- 120 minute sessions (Adventure)
('Adventure', 120, 180, 108, 8, 1.00, true);

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
  'New Eat (25 min)' as reward_type,
  base_xp as xp,
  base_coins as coins,
  base_sparks as sparks
FROM session_rewards_master 
WHERE session_type = 'Eat' AND duration_minutes = 25;

-- Count total session reward entries
SELECT COUNT(*) as total_session_rewards FROM session_rewards_master WHERE is_active = true;

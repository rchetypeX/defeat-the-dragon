-- =====================================================
-- UPDATE SESSION REWARDS MASTER TABLE
-- =====================================================
-- This script updates the session_rewards_master table with new default values
-- Run this after the comprehensive schema has been applied

-- First, clear existing data
DELETE FROM session_rewards_master;

-- Insert new session rewards data
INSERT INTO session_rewards_master (session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier) VALUES
-- 5-15 minutes: Train sessions
('Train', 5, 5, 3, 0, 1.0),
('Train', 10, 10, 6, 0, 1.0),
('Train', 15, 16, 9, 1, 1.0),

-- 16-30 minutes: Eat sessions
('Eat', 20, 22, 13, 1, 1.0),
('Eat', 25, 28, 16, 1, 1.0),
('Eat', 30, 34, 20, 2, 1.0),

-- 31-45 minutes: Learn sessions
('Learn', 35, 41, 24, 2, 1.0),
('Learn', 40, 48, 28, 2, 1.0),
('Learn', 45, 55, 33, 3, 1.0),

-- 46-60 minutes: Bathe sessions
('Bathe', 50, 62, 37, 3, 1.0),
('Bathe', 55, 70, 42, 3, 1.0),
('Bathe', 60, 78, 46, 4, 1.0),

-- 61-75 minutes: Sleep sessions
('Sleep', 65, 86, 51, 4, 1.0),
('Sleep', 70, 94, 56, 4, 1.0),
('Sleep', 75, 103, 61, 5, 1.0),

-- 76-90 minutes: Maintain sessions
('Maintain', 80, 112, 67, 5, 1.0),
('Maintain', 85, 121, 72, 5, 1.0),
('Maintain', 90, 130, 78, 6, 1.0),

-- 91-105 minutes: Fight sessions
('Fight', 95, 140, 84, 6, 1.0),
('Fight', 100, 150, 90, 6, 1.0),
('Fight', 105, 158, 94, 7, 1.0),

-- 106-120 minutes: Adventure sessions
('Adventure', 110, 165, 99, 7, 1.0),
('Adventure', 115, 172, 103, 7, 1.0),
('Adventure', 120, 180, 108, 8, 1.0);

-- Verify the update
SELECT 
    session_type,
    duration_minutes,
    base_xp,
    base_coins,
    base_sparks,
    bonus_multiplier
FROM session_rewards_master 
WHERE is_active = true
ORDER BY session_type, duration_minutes;

-- Show summary by session type
SELECT 
    session_type,
    COUNT(*) as reward_tiers,
    MIN(duration_minutes) as min_duration,
    MAX(duration_minutes) as max_duration,
    MIN(base_xp) as min_xp,
    MAX(base_xp) as max_xp,
    MIN(base_coins) as min_coins,
    MAX(base_coins) as max_coins,
    MIN(base_sparks) as min_sparks,
    MAX(base_sparks) as max_sparks
FROM session_rewards_master 
WHERE is_active = true
GROUP BY session_type
ORDER BY min_duration;

-- Final verification message
SELECT 'Session rewards updated successfully! New structure applied.' as status;

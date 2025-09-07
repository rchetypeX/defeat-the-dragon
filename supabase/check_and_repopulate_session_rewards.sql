-- Check current data and repopulate session_rewards_master table
-- This will show what's currently in the table and then add missing data

-- First, let's see what's currently in the table
SELECT 'Current records in session_rewards_master:' as status;
SELECT COUNT(*) as total_records FROM session_rewards_master;

SELECT 'All current records:' as status;
SELECT session_type, duration_minutes, base_xp, base_coins, base_sparks 
FROM session_rewards_master 
ORDER BY session_type, duration_minutes;

-- Clear the table and repopulate with correct data
DELETE FROM session_rewards_master;

-- Insert all session rewards data (5-120 minutes)
INSERT INTO session_rewards_master (session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier, is_active) VALUES

-- Train sessions (5-15 minutes)
('Train', 5, 5, 3, 0, 1.00, true),
('Train', 10, 10, 6, 0, 1.00, true),
('Train', 15, 16, 9, 1, 1.00, true),

-- Eat sessions (16-30 minutes)
('Eat', 20, 22, 13, 1, 1.00, true),
('Eat', 25, 28, 16, 1, 1.00, true),
('Eat', 30, 34, 20, 2, 1.00, true),

-- Learn sessions (31-45 minutes)
('Learn', 35, 41, 24, 2, 1.00, true),
('Learn', 40, 48, 28, 2, 1.00, true),
('Learn', 45, 55, 33, 3, 1.00, true),

-- Bathe sessions (46-60 minutes)
('Bathe', 50, 62, 37, 3, 1.00, true),
('Bathe', 55, 70, 42, 3, 1.00, true),
('Bathe', 60, 78, 46, 4, 1.00, true),

-- Sleep sessions (61-75 minutes)
('Sleep', 65, 86, 51, 4, 1.00, true),
('Sleep', 70, 94, 56, 4, 1.00, true),
('Sleep', 75, 103, 61, 5, 1.00, true),

-- Maintain sessions (76-90 minutes)
('Maintain', 80, 112, 67, 5, 1.00, true),
('Maintain', 85, 121, 72, 5, 1.00, true),
('Maintain', 90, 130, 78, 6, 1.00, true),

-- Fight sessions (91-105 minutes)
('Fight', 95, 140, 84, 6, 1.00, true),
('Fight', 100, 150, 90, 6, 1.00, true),
('Fight', 105, 158, 94, 7, 1.00, true),

-- Adventure sessions (106-120 minutes)
('Adventure', 110, 165, 99, 7, 1.00, true),
('Adventure', 115, 172, 103, 7, 1.00, true),
('Adventure', 120, 180, 108, 8, 1.00, true);

-- Verify the data was inserted correctly
SELECT 'After repopulation - total records:' as status;
SELECT COUNT(*) as total_records FROM session_rewards_master;

SELECT 'All records by session type:' as status;
SELECT 
  session_type,
  COUNT(*) as record_count,
  MIN(duration_minutes) as min_duration,
  MAX(duration_minutes) as max_duration
FROM session_rewards_master 
GROUP BY session_type
ORDER BY session_type;

-- Test a few different durations
SELECT 'Testing 5-minute Train session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Train' AND duration_minutes = 5;

SELECT 'Testing 25-minute Eat session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Eat' AND duration_minutes = 25;

SELECT 'Testing 60-minute Bathe session:' as test;
SELECT * FROM session_rewards_master WHERE session_type = 'Bathe' AND duration_minutes = 60;

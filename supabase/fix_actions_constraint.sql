-- Fix session actions constraint - run this in Supabase SQL Editor

-- Remove old constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_action_check;

-- Add new constraint with correct action values  
ALTER TABLE sessions ADD CONSTRAINT sessions_action_check 
CHECK (action IN ('Train', 'Eat', 'Learn', 'Bathe', 'Sleep', 'Maintain', 'Fight', 'Adventure'));

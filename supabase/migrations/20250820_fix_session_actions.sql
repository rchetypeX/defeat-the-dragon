-- Fix session actions constraint to match new action system
-- Remove old constraint and add new one with correct action values

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_action_check;

ALTER TABLE sessions ADD CONSTRAINT sessions_action_check 
CHECK (action IN ('Train', 'Eat', 'Learn', 'Bathe', 'Sleep', 'Maintain', 'Fight', 'Adventure'));

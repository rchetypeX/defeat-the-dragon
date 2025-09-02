-- Revert migration to remove character size preferences
-- This removes the character_size column from user_settings table
-- and drops the associated function.

-- Drop the function to reset character size to default
DROP FUNCTION IF EXISTS reset_character_size_to_default(UUID);

-- Drop the function to get recommended character size
DROP FUNCTION IF EXISTS get_recommended_character_size(UUID);

-- Remove character_size column from user_settings table
ALTER TABLE user_settings
DROP COLUMN IF EXISTS character_size;

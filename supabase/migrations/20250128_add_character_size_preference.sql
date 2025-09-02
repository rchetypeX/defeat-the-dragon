-- Migration to add character size preferences
-- This allows users to choose between small, medium, and large character sizes
-- Old accounts can be reset to use the new smaller default size

-- Add character_size column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS character_size VARCHAR(20) DEFAULT 'small' CHECK (character_size IN ('small', 'medium', 'large'));

-- Update existing users to use 'medium' size (current large size) for backward compatibility
-- This preserves the current experience for existing users
UPDATE user_settings 
SET character_size = 'medium' 
WHERE character_size IS NULL OR character_size = 'small';

-- Create function to reset character size to new default
CREATE OR REPLACE FUNCTION reset_character_size_to_default(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_settings 
  SET character_size = 'small', updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RAISE NOTICE 'Character size reset to small for user %', user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_character_size_to_default(UUID) TO authenticated;

-- Create function to get recommended character size based on user preferences
CREATE OR REPLACE FUNCTION get_recommended_character_size(user_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  user_character_size VARCHAR(20);
  user_accessibility JSONB;
BEGIN
  -- Get user's current character size preference
  SELECT character_size, accessibility 
  INTO user_character_size, user_accessibility
  FROM user_settings 
  WHERE user_id = user_uuid;
  
  -- If user has high contrast enabled, recommend larger size for accessibility
  IF user_accessibility->>'highContrast' = 'true' THEN
    RETURN 'large';
  END IF;
  
  -- Return user's preference or default to small
  RETURN COALESCE(user_character_size, 'small');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recommended_character_size(UUID) TO authenticated;

-- Add comment to document the new system
COMMENT ON COLUMN user_settings.character_size IS 'Character size preference: small (new default), medium (current large), large (accessibility)';
COMMENT ON FUNCTION reset_character_size_to_default(UUID) IS 'Reset character size to new small default for old accounts';
COMMENT ON FUNCTION get_recommended_character_size(UUID) IS 'Get recommended character size based on user preferences and accessibility needs';

-- Create function to handle Base App user authentication
-- This function creates or updates a profile for Base App users

CREATE OR REPLACE FUNCTION handle_baseapp_user(
  baseapp_user_id TEXT,
  display_name TEXT DEFAULT NULL,
  pfp_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
  profile_record RECORD;
BEGIN
  -- Convert Base App user ID to UUID format
  -- Base App uses numeric FIDs, so we'll create a deterministic UUID
  user_uuid := gen_random_uuid();
  
  -- Check if profile already exists for this Base App user
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE id::text = baseapp_user_id 
  OR (metadata->>'baseapp_fid')::text = baseapp_user_id;
  
  IF profile_record IS NULL THEN
    -- Create new profile for Base App user
    INSERT INTO profiles (
      id,
      display_name,
      pfp_url,
      metadata
    ) VALUES (
      user_uuid,
      COALESCE(display_name, 'Base App User'),
      pfp_url,
      jsonb_build_object(
        'baseapp_fid', baseapp_user_id,
        'auth_type', 'baseapp'
      )
    );
    
    RAISE NOTICE 'Created new profile for Base App user: %', baseapp_user_id;
  ELSE
    -- Update existing profile
    user_uuid := profile_record.id;
    
    UPDATE profiles 
    SET 
      display_name = COALESCE(display_name, profile_record.display_name),
      pfp_url = COALESCE(pfp_url, profile_record.pfp_url),
      metadata = COALESCE(profile_record.metadata, '{}'::jsonb) || 
                 jsonb_build_object('baseapp_fid', baseapp_user_id, 'auth_type', 'baseapp'),
      updated_at = NOW()
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Updated existing profile for Base App user: %', baseapp_user_id;
  END IF;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_baseapp_user(TEXT, TEXT, TEXT) TO authenticated;

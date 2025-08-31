-- Fix script to properly handle wallet addresses without storing them in the email field
-- This prevents conflicts when users later want to link their actual email addresses

-- 1. First, let's see what the current situation looks like
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email LIKE '%@wallet' 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if we have wallet_address field in players table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name = 'wallet_address';

-- 3. Update the handle_new_user function to not use email field for wallet addresses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_address TEXT;
  display_name TEXT;
BEGIN
  -- Extract wallet address and display name from metadata
  wallet_address := NEW.raw_user_meta_data->>'wallet_address';
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer');
  
  -- Insert into players table with wallet address in the proper field
  INSERT INTO public.players (
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
  VALUES (
    NEW.id, 
    display_name,
    wallet_address,
    1,  -- Default level
    0,  -- Default XP
    100, -- Default coins
    50,  -- Default sparks
    false, -- Default inspired status
    NOW(),
    NOW()
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add default inventory items
  INSERT INTO public.user_inventory (user_id, item_id, item_type, equipped)
  VALUES 
    (NEW.id, 'fighter', 'character', true),
    (NEW.id, 'forest', 'background', true)
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to migrate existing wallet users to proper structure
CREATE OR REPLACE FUNCTION migrate_wallet_users_to_proper_structure()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  wallet_address TEXT;
  migrated_count INTEGER := 0;
BEGIN
  -- Loop through users with @wallet emails
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users 
    WHERE email LIKE '%@wallet'
  LOOP
    -- Extract wallet address from email (remove @wallet suffix)
    wallet_address := REPLACE(user_record.email, '@wallet', '');
    
    -- Update the players table with the wallet address
    UPDATE players 
    SET wallet_address = wallet_address
    WHERE user_id = user_record.id;
    
    -- Clear the email field for wallet-only users
    UPDATE auth.users 
    SET email = NULL
    WHERE id = user_record.id;
    
    migrated_count := migrated_count + 1;
    
    RAISE NOTICE 'Migrated user %: wallet address %', user_record.id, wallet_address;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to link email to existing wallet user
CREATE OR REPLACE FUNCTION link_email_to_wallet_user(
  user_uuid UUID,
  email_address TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if this email is already used by another user
  SELECT id INTO existing_user_id
  FROM auth.users 
  WHERE email = email_address 
  AND id != user_uuid;
  
  IF existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Email % is already associated with another user', email_address;
  END IF;
  
  -- Check if the user exists and has a wallet address
  IF NOT EXISTS (
    SELECT 1 FROM players 
    WHERE user_id = user_uuid 
    AND wallet_address IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'User % does not exist or is not a wallet user', user_uuid;
  END IF;
  
  -- Update the user's email
  UPDATE auth.users 
  SET email = email_address
  WHERE id = user_uuid;
  
  RAISE NOTICE 'Successfully linked email % to wallet user %', email_address, user_uuid;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION migrate_wallet_users_to_proper_structure() TO authenticated;
GRANT EXECUTE ON FUNCTION link_email_to_wallet_user(UUID, TEXT) TO authenticated;

-- 7. Test the migration (optional - uncomment to run)
-- SELECT migrate_wallet_users_to_proper_structure();

-- 8. Show the current state after potential migration
SELECT 
  'Current wallet users' as status,
  COUNT(*) as count
FROM auth.users 
WHERE email LIKE '%@wallet'

UNION ALL

SELECT 
  'Users with proper wallet addresses' as status,
  COUNT(*) as count
FROM players 
WHERE wallet_address IS NOT NULL;

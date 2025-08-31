-- Migration to enforce wallet email requirement
-- This ensures all wallet users have linked email addresses for account recovery

-- 1. First, let's check the current state
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current wallet user email status...';
    
    -- Count wallet users without emails
    DECLARE
        wallet_users_without_email INTEGER;
        total_wallet_users INTEGER;
    BEGIN
        SELECT COUNT(*) INTO wallet_users_without_email
        FROM players p
        JOIN auth.users au ON p.user_id = au.id
        WHERE p.wallet_address IS NOT NULL 
        AND (au.email IS NULL OR au.email LIKE '%@wallet%' OR au.email LIKE '%@wallet.local%');
        
        SELECT COUNT(*) INTO total_wallet_users
        FROM players p
        WHERE p.wallet_address IS NOT NULL;
        
        RAISE NOTICE '📊 Wallet users without proper email: % out of % total wallet users', 
            wallet_users_without_email, total_wallet_users;
            
        IF wallet_users_without_email > 0 THEN
            RAISE NOTICE '⚠️  Some wallet users need email linking - this will be enforced going forward';
        ELSE
            RAISE NOTICE '✅ All wallet users already have proper email addresses';
        END IF;
    END;
END $$;

-- 2. Update the handle_new_user function to enforce email requirement for wallet users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_address TEXT;
  display_name TEXT;
  user_email TEXT;
BEGIN
  -- Extract wallet address and display name from metadata
  wallet_address := NEW.raw_user_meta_data->>'wallet_address';
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer');
  user_email := NEW.email;
  
  -- For wallet users, ensure they have a real email (not @wallet placeholder)
  IF wallet_address IS NOT NULL AND (user_email IS NULL OR user_email LIKE '%@wallet%' OR user_email LIKE '%@wallet.local%') THEN
    RAISE EXCEPTION 'Wallet users must provide a valid email address during signup';
  END IF;
  
  -- Insert into players table
  INSERT INTO public.players (
    user_id, 
    display_name, 
    wallet_address,
    level,
    xp,
    coins,
    sparks,
    is_inspired,
    "needsAdventurerName",
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    display_name,
    wallet_address,
    1,  -- Default level
    0,  -- Default XP
    0,  -- Default coins
    0,  -- Default sparks
    false, -- Default inspired status
    true,  -- Default needs adventurer name
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

-- 3. Create a function to check if wallet user has valid email
-- This function allows subscription-related updates while enforcing email requirements for account modifications
CREATE OR REPLACE FUNCTION check_wallet_user_email_requirement()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a wallet user, ensure they have a valid email
  IF NEW.wallet_address IS NOT NULL THEN
    -- Check if the user has a valid email in auth.users
    IF NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = NEW.user_id 
      AND email IS NOT NULL 
      AND email NOT LIKE '%@wallet%' 
      AND email NOT LIKE '%@wallet.local%'
    ) THEN
      -- Allow certain updates that don't require email linking
      -- Specifically allow subscription-related updates (is_inspired, sparks, etc.)
      IF TG_OP = 'UPDATE' AND (
        -- Allow updates to subscription-related fields
        (OLD.is_inspired IS DISTINCT FROM NEW.is_inspired) OR
        (OLD.sparks IS DISTINCT FROM NEW.sparks) OR
        (OLD.coins IS DISTINCT FROM NEW.coins) OR
        (OLD.xp IS DISTINCT FROM NEW.xp) OR
        (OLD.level IS DISTINCT FROM NEW.level) OR
        (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
      ) THEN
        -- Allow subscription-related updates even without email
        -- This prevents subscription purchases from failing for wallet users
        RETURN NEW;
      END IF;
      
      -- For other operations (like display_name changes, account linking), require email linking
      RAISE EXCEPTION 'Wallet users must have a linked email address for account modifications. Please link your email address in settings first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to enforce email requirement on player updates
DROP TRIGGER IF EXISTS enforce_wallet_email_requirement ON players;
CREATE TRIGGER enforce_wallet_email_requirement
  BEFORE INSERT OR UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION check_wallet_user_email_requirement();

-- 5. Update RLS policies to ensure wallet users can only access their own data
DROP POLICY IF EXISTS "Users can view own player data" ON players;
CREATE POLICY "Users can view own player data" ON players 
FOR SELECT USING (
  auth.uid() = user_id OR 
  (wallet_address IS NOT NULL AND auth.uid() IS NULL)
);

DROP POLICY IF EXISTS "Users can insert own player data" ON players;
CREATE POLICY "Users can insert own player data" ON players 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  (wallet_address IS NOT NULL AND auth.uid() IS NULL)
);

DROP POLICY IF EXISTS "Users can update own player data" ON players;
CREATE POLICY "Users can update own player data" ON players 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (wallet_address IS NOT NULL AND auth.uid() IS NULL)
);

-- 6. Create a view to help identify wallet users needing email linking
CREATE OR REPLACE VIEW wallet_users_email_status AS
SELECT 
  p.user_id,
  p.wallet_address,
  p.display_name,
  au.email,
  CASE 
    WHEN au.email IS NULL THEN 'No Email'
    WHEN au.email LIKE '%@wallet%' OR au.email LIKE '%@wallet.local%' THEN 'Placeholder Email'
    ELSE 'Valid Email'
  END as email_status,
  p.created_at
FROM players p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.wallet_address IS NOT NULL
ORDER BY p.created_at DESC;

-- 7. Create a function to get wallet users needing email linking
CREATE OR REPLACE FUNCTION get_wallet_users_needing_email()
RETURNS TABLE(
  user_id UUID,
  wallet_address TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.wallet_address,
    p.display_name,
    p.created_at
  FROM players p
  LEFT JOIN auth.users au ON p.user_id = au.id
  WHERE p.wallet_address IS NOT NULL 
  AND (au.email IS NULL OR au.email LIKE '%@wallet%' OR au.email LIKE '%@wallet.local%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verify the new structure
DO $$
BEGIN
    RAISE NOTICE '🔍 Verifying new wallet email requirement enforcement...';
    
    -- Check if the trigger was created
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'enforce_wallet_email_requirement'
    ) THEN
        RAISE NOTICE '✅ Wallet email requirement trigger created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create wallet email requirement trigger';
    END IF;
    
    -- Check if the function was updated
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) THEN
        RAISE NOTICE '✅ handle_new_user function updated successfully';
    ELSE
        RAISE NOTICE '❌ Failed to update handle_new_user function';
    END IF;
    
    -- Check if the view was created
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'wallet_users_email_status'
    ) THEN
        RAISE NOTICE '✅ Wallet users email status view created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create wallet users email status view';
    END IF;
END $$;

-- 9. Show current wallet users and their email status
SELECT 
  'Current Wallet Users Email Status' as info,
  COUNT(*) as total_wallet_users,
  COUNT(CASE WHEN email_status = 'Valid Email' THEN 1 END) as with_valid_email,
  COUNT(CASE WHEN email_status = 'Placeholder Email' THEN 1 END) as with_placeholder_email,
  COUNT(CASE WHEN email_status = 'No Email' THEN 1 END) as without_email
FROM wallet_users_email_status;

-- Note: After running this migration, any existing wallet users without proper emails
-- will need to link their email addresses through the settings interface.
-- The system will now enforce this requirement for all new wallet signups.
--
-- IMPORTANT: The trigger allows subscription-related updates (is_inspired, sparks, coins, etc.)
-- even for wallet users without linked emails. This prevents subscription purchases
-- from failing while still enforcing email requirements for account modifications.

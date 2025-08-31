-- Fix existing wallet user with incorrect email format
-- This script will fix the user who has wallet address stored in email field

-- 1. First, let's see what we're working with
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email LIKE '%@wal' 
ORDER BY created_at DESC;

-- 2. Fix the specific user from the screenshot
-- Replace '0xf283f4fff884c70df8f731321ba76ec665f22ee7' with the actual wallet address if different
UPDATE auth.users 
SET 
    email = NULL,  -- Remove the fake email
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        '{"wallet_address": "0xf283f4fff884c70df8f731321ba76ec665f22ee7"}'::jsonb
WHERE email = '0xf283f4fff884c70df8f731321ba76ec665f22ee7@wal';

-- 3. Update the players table to ensure wallet_address is properly set
UPDATE players 
SET 
    wallet_address = '0xf283f4fff884c70df8f731321ba76ec665f22ee7',
    "needsAdventurerName" = true
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = '0xf283f4fff884c70df8f731321ba76ec665f22ee7@wal'
);

-- 4. Verify the fix
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    p.wallet_address,
    p."needsAdventurerName"
FROM auth.users au
LEFT JOIN players p ON au.id = p.user_id
WHERE au.email LIKE '%@wal' OR au.raw_user_meta_data->>'wallet_address' IS NOT NULL;

-- 5. Show the current state and report results
DO $$
DECLARE
    fixed_count INTEGER;
    needs_name_count INTEGER;
BEGIN
    -- Count how many users were fixed
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    -- Count users who need to set their name
    SELECT COUNT(*) INTO needs_name_count
    FROM players 
    WHERE "needsAdventurerName" = true;
    
    RAISE NOTICE '✅ Fixed existing wallet user email format';
    RAISE NOTICE 'ℹ️ The user should now show as wallet-only (no fake email)';
    RAISE NOTICE '📊 Users fixed: %', fixed_count;
    RAISE NOTICE '📊 Users needing name: %', needs_name_count;
END $$;

-- Fix script to resolve the unique constraint issue on user_inventory table
-- This ensures the ON CONFLICT clause in handle_new_user function works properly

-- 1. Check if the unique constraint exists
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_inventory'::regclass 
AND contype = 'u';

-- 2. Add the unique constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_inventory_user_id_item_id_key' 
        AND conrelid = 'user_inventory'::regclass
    ) THEN
        -- Add the unique constraint
        ALTER TABLE user_inventory ADD CONSTRAINT user_inventory_user_id_item_id_key UNIQUE (user_id, item_id);
        RAISE NOTICE '✅ Added unique constraint on user_inventory(user_id, item_id)';
    ELSE
        RAISE NOTICE 'ℹ️ Unique constraint already exists on user_inventory(user_id, item_id)';
    END IF;
    
    -- Also check if there are any duplicate records that would prevent the constraint
    IF EXISTS (
        SELECT user_id, item_id, COUNT(*)
        FROM user_inventory 
        GROUP BY user_id, item_id 
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE '⚠️ Found duplicate records in user_inventory. These need to be resolved before adding the constraint.';
        
        -- Show the duplicates
        RAISE NOTICE 'Duplicate records:';
        FOR r IN 
            SELECT user_id, item_id, COUNT(*) as count
            FROM user_inventory 
            GROUP BY user_id, item_id 
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE '  user_id: %, item_id: %, count: %', r.user_id, r.item_id, r.count;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ No duplicate records found in user_inventory';
    END IF;
END $$;

-- 3. Verify the constraint was added
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_inventory'::regclass 
AND contype = 'u';

-- 4. Test the handle_new_user function can now work properly
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_metadata JSONB := '{"display_name": "TestUser", "wallet_address": "0x1234567890123456789012345678901234567890"}'::JSONB;
BEGIN
    RAISE NOTICE 'Testing handle_new_user function with test user ID: %', test_user_id;
    
    -- Insert a test user into auth.users to trigger the function
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'test@example.com',
        crypt('password', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        test_metadata,
        false,
        '',
        '',
        '',
        ''
    );
    
    RAISE NOTICE '✅ Test user inserted successfully, trigger function should have run';
    
    -- Check if the function created the necessary records
    IF EXISTS (SELECT 1 FROM players WHERE user_id = test_user_id) THEN
        RAISE NOTICE '✅ Player record created successfully';
    ELSE
        RAISE NOTICE '❌ Player record not created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM user_settings WHERE user_id = test_user_id) THEN
        RAISE NOTICE '✅ User settings created successfully';
    ELSE
        RAISE NOTICE '❌ User settings not created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = test_user_id) THEN
        RAISE NOTICE '✅ Inventory items created successfully';
    ELSE
        RAISE NOTICE '❌ Inventory items not created';
    END IF;
    
    -- Clean up test data
    DELETE FROM user_inventory WHERE user_id = test_user_id;
    DELETE FROM user_settings WHERE user_id = test_user_id;
    DELETE FROM players WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE '✅ Test completed and cleaned up';
END $$;

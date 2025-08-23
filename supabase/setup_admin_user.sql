-- Script to set up an admin user
-- Replace 'your-user-email@example.com' with the actual email of the user you want to make admin

-- Option 1: Set admin role for a user by email
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'your-user-email@example.com';

-- Option 2: Set admin role for a user by user ID (if you know the UUID)
-- UPDATE auth.users 
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE id = 'your-user-uuid-here';

-- Option 3: Set admin role for the most recently created user
-- UPDATE auth.users 
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);

-- Verify the admin user was created
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';

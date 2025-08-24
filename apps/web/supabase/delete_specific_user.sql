-- =====================================================
-- DELETE SPECIFIC USER BY EMAIL
-- =====================================================
-- This script will delete only your specific email account
-- Replace 'ebonuan@gmail.com' with your actual email if different

-- 1. First, let's see what users exist
SELECT id, email, created_at FROM auth.users WHERE email = 'ebonuan@gmail.com';

-- 2. Delete the specific user and all related data
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');
DELETE FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');
DELETE FROM auth.users WHERE email = 'ebonuan@gmail.com';

-- 3. Also delete any related data from your custom tables
DELETE FROM players WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');
DELETE FROM profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');

-- 4. Verify the user is gone
SELECT 'User deleted successfully' as status WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ebonuan@gmail.com');

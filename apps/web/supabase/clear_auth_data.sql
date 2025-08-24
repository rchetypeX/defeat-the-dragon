-- =====================================================
-- CLEAR SUPABASE AUTH DATA
-- =====================================================
-- This script will clear all authentication data from your Supabase project
-- WARNING: This will delete ALL users and their authentication data
-- Only run this if you want to completely reset your auth system

-- 1. Delete all users from auth.users table
DELETE FROM auth.users;

-- 2. Clear any auth-related sessions
DELETE FROM auth.sessions;

-- 3. Clear any auth-related refresh tokens
DELETE FROM auth.refresh_tokens;

-- 4. Clear any auth-related identities
DELETE FROM auth.identities;

-- 5. Clear any auth-related audit logs (if they exist)
-- Note: This table might not exist in all Supabase projects
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'audit_log_entries') THEN
        DELETE FROM auth.audit_log_entries;
    END IF;
END $$;

-- 6. Reset any sequences that might be used by auth tables
-- This ensures new users get fresh IDs
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_schema = 'auth' AND sequence_name = 'users_id_seq') THEN
        ALTER SEQUENCE auth.users_id_seq RESTART WITH 1;
    END IF;
END $$;

-- 7. Verify the cleanup
SELECT 
    'auth.users' as table_name,
    COUNT(*) as remaining_records
FROM auth.users
UNION ALL
SELECT 
    'auth.sessions' as table_name,
    COUNT(*) as remaining_records
FROM auth.sessions
UNION ALL
SELECT 
    'auth.refresh_tokens' as table_name,
    COUNT(*) as remaining_records
FROM auth.refresh_tokens
UNION ALL
SELECT 
    'auth.identities' as table_name,
    COUNT(*) as remaining_records
FROM auth.identities;

-- =====================================================
-- ALTERNATIVE: Delete specific user by email
-- =====================================================
-- If you only want to delete your specific email account, use this instead:

-- DELETE FROM auth.users WHERE email = 'ebonuan@gmail.com';
-- DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');
-- DELETE FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');
-- DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ebonuan@gmail.com');

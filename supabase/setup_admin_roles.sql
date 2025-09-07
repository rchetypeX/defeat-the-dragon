-- Setup Admin Roles
-- This script adds the role column to the players table and sets up admin users

-- 1. Add role column to players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE players ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
        RAISE NOTICE '✅ Added role column to players table';
    ELSE
        RAISE NOTICE 'ℹ️ Role column already exists in players table';
    END IF;
END $$;

-- 2. Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);

-- 3. Show current users and their roles
SELECT 
    'Current users and roles:' as info,
    user_id,
    display_name,
    role,
    level,
    xp,
    created_at
FROM players 
ORDER BY created_at DESC;

-- 4. Instructions for setting up admin users
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the query above
-- Uncomment and run the following line after you find your user ID:

-- UPDATE players SET role = 'admin' WHERE user_id = 'YOUR_USER_ID_HERE';

-- 5. Alternative: Set up admin by email (if you know your email)
-- Uncomment and modify the following lines:
-- UPDATE players 
-- SET role = 'admin' 
-- WHERE user_id = (
--     SELECT id FROM auth.users 
--     WHERE email = 'your-email@example.com'
-- );

-- 6. Verify admin setup
-- After setting up admin, run this to verify:
-- SELECT 
--     'Admin users:' as info,
--     user_id,
--     display_name,
--     role
-- FROM players 
-- WHERE role IN ('admin', 'super_admin');

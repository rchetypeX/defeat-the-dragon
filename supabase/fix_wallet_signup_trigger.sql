-- Fix wallet signup trigger by removing references to deleted profiles table
-- This script should be run to fix the handle_new_user function

-- First, check if the trigger exists and drop it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to only create player data (no profiles table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert into players table (profiles table was removed)
  INSERT INTO public.players (
    user_id, 
    display_name, 
    wallet_address,
    level,
    xp,
    coins,
    sparks,
    is_inspired,
    created_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'),
    NEW.raw_user_meta_data->>'wallet_address',
    1,  -- Default level
    0,  -- Default XP
    100, -- Default coins
    50,  -- Default sparks
    false, -- Default inspired status
    NOW()
  );
  
  -- Create default user settings if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Add default inventory items if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_inventory') THEN
    INSERT INTO public.user_inventory (user_id, item_id, item_type, equipped)
    VALUES 
      (NEW.id, 'fighter', 'character', true),
      (NEW.id, 'forest', 'background', true)
    ON CONFLICT (user_id, item_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Verify the function was created correctly
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Check if the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

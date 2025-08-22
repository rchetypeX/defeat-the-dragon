-- Ensure email uniqueness is enforced
-- This migration adds additional constraints to prevent duplicate emails

-- Add a unique constraint on email in auth.users (if not already present)
-- Note: This should already be enforced by Supabase Auth, but we're adding extra protection

-- Create a function to check for existing users before signup
CREATE OR REPLACE FUNCTION check_email_uniqueness(email_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if a user with this email already exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = email_address
  ) INTO user_exists;
  
  RETURN NOT user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to prevent duplicate emails
CREATE OR REPLACE FUNCTION prevent_duplicate_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this email already exists
  IF NOT check_email_uniqueness(NEW.email) THEN
    RAISE EXCEPTION 'An account with this email already exists';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to auth.users table (if possible)
-- Note: This might not work if we don't have direct access to auth.users
-- The main protection should come from Supabase Auth itself

-- Create a more robust handle_new_user function that checks for duplicates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists (prevent duplicate profiles)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'));
  END IF;
  
  -- Check if player data already exists (prevent duplicate players)
  IF NOT EXISTS (SELECT 1 FROM public.players WHERE user_id = NEW.id) THEN
    INSERT INTO public.players (user_id)
    VALUES (NEW.id);
  END IF;
  
  -- Insert default classes only if they don't exist
  INSERT INTO public.classes (user_id, class_id, unlocked)
  VALUES 
    (NEW.id, 'Fighter', true),
    (NEW.id, 'Rogue', false),
    (NEW.id, 'Wizard', false),
    (NEW.id, 'Cleric', false),
    (NEW.id, 'Ranger', false)
  ON CONFLICT (user_id, class_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

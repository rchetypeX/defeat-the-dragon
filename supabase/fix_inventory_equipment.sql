-- Fix inventory equipment issues
-- This script ensures only one item per category is equipped per user

-- First, let's see what the current state looks like
SELECT 
  user_id,
  item_type,
  item_id,
  equipped,
  COUNT(*) as count
FROM user_inventory 
WHERE equipped = true
GROUP BY user_id, item_type, item_id, equipped
ORDER BY user_id, item_type;

-- Fix: Unequip all items first, then equip only the most recently acquired item per category per user
WITH ranked_items AS (
  SELECT 
    id,
    user_id,
    item_type,
    item_id,
    equipped,
    acquired_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, item_type 
      ORDER BY acquired_at DESC
    ) as rn
  FROM user_inventory
  WHERE equipped = true
)
UPDATE user_inventory 
SET equipped = false
WHERE id IN (
  SELECT id 
  FROM ranked_items 
  WHERE rn > 1
);

-- Now equip only the most recently acquired item per category per user
WITH ranked_items AS (
  SELECT 
    id,
    user_id,
    item_type,
    item_id,
    equipped,
    acquired_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, item_type 
      ORDER BY acquired_at DESC
    ) as rn
  FROM user_inventory
  WHERE equipped = true
)
UPDATE user_inventory 
SET equipped = true
WHERE id IN (
  SELECT id 
  FROM ranked_items 
  WHERE rn = 1
);

-- Verify the fix worked
SELECT 
  user_id,
  item_type,
  item_id,
  equipped,
  acquired_at
FROM user_inventory 
WHERE equipped = true
ORDER BY user_id, item_type, acquired_at DESC;

-- Create a function to ensure only one item per category is equipped
CREATE OR REPLACE FUNCTION ensure_single_equipped_item()
RETURNS TRIGGER AS $$
BEGIN
  -- If we're equipping an item, unequip all other items of the same type for this user
  IF NEW.equipped = true AND (OLD.equipped = false OR OLD.equipped IS NULL) THEN
    UPDATE user_inventory 
    SET equipped = false 
    WHERE user_id = NEW.user_id 
      AND item_type = NEW.item_type 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically ensure single equipped item
DROP TRIGGER IF EXISTS trigger_ensure_single_equipped_item ON user_inventory;
CREATE TRIGGER trigger_ensure_single_equipped_item
  BEFORE UPDATE ON user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_equipped_item();

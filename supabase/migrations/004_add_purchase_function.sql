-- Create a function to handle item purchases atomically
CREATE OR REPLACE FUNCTION purchase_item(
  p_user_id UUID,
  p_item_id TEXT,
  p_item_type TEXT,
  p_price INTEGER,
  p_currency TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update player currency
  IF p_currency = 'coins' THEN
    UPDATE players 
    SET coins = coins - p_price 
    WHERE user_id = p_user_id;
  ELSIF p_currency = 'sparks' THEN
    UPDATE players 
    SET sparks = sparks - p_price 
    WHERE user_id = p_user_id;
  END IF;

  -- Add item to inventory
  INSERT INTO user_inventory (
    user_id,
    item_id,
    item_type,
    quantity,
    equipped,
    acquired_at
  ) VALUES (
    p_user_id,
    p_item_id,
    p_item_type,
    1,
    false,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

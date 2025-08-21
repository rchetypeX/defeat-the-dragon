-- Insert sample shop items
INSERT INTO shop_items (sku, name, price_coins, price_sparks, type, class_lock, min_level) VALUES
-- Fighter items
('sword_basic', 'Basic Sword', 100, 0, 'weapon', 'Fighter', 1),
('armor_iron', 'Iron Armor', 150, 0, 'armor', 'Fighter', 1),
('shield_wooden', 'Wooden Shield', 75, 0, 'shield', 'Fighter', 1),

-- Rogue items
('dagger_stealth', 'Stealth Dagger', 120, 0, 'weapon', 'Rogue', 1),
('cloak_shadow', 'Shadow Cloak', 80, 0, 'armor', 'Rogue', 1),
('boots_silent', 'Silent Boots', 60, 0, 'boots', 'Rogue', 1),

-- Wizard items
('staff_magic', 'Magic Staff', 200, 0, 'weapon', 'Wizard', 1),
('robe_arcane', 'Arcane Robe', 180, 0, 'armor', 'Wizard', 1),
('hat_pointy', 'Pointy Hat', 90, 0, 'hat', 'Wizard', 1),

-- Cleric items
('mace_holy', 'Holy Mace', 160, 0, 'weapon', 'Cleric', 1),
('armor_divine', 'Divine Armor', 220, 0, 'armor', 'Cleric', 1),
('amulet_faith', 'Amulet of Faith', 110, 0, 'accessory', 'Cleric', 1),

-- Ranger items
('bow_wooden', 'Wooden Bow', 140, 0, 'weapon', 'Ranger', 1),
('armor_leather', 'Leather Armor', 120, 0, 'armor', 'Ranger', 1),
('quiver_basic', 'Basic Quiver', 70, 0, 'accessory', 'Ranger', 1),

-- Universal cosmetics (Sparks only)
('pet_dragon', 'Baby Dragon Pet', 0, 500, 'pet', NULL, 1),
('aura_fire', 'Fire Aura', 0, 300, 'aura', NULL, 1),
('title_legend', 'Legend Title', 0, 200, 'title', NULL, 1),
('emote_victory', 'Victory Dance', 0, 150, 'emote', NULL, 1),

-- Universal items (Coins only)
('potion_health', 'Health Potion', 50, 0, 'consumable', NULL, 1),
('scroll_teleport', 'Teleport Scroll', 30, 0, 'consumable', NULL, 1),
('gem_rare', 'Rare Gem', 200, 0, 'material', NULL, 1);

-- Note: This will be run after the schema is deployed
-- You can run this in the Supabase SQL Editor after the main schema

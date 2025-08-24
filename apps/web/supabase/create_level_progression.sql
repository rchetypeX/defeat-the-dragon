-- Create Level Progression Master Table
-- This table allows you to edit XP requirements for each level centrally and have it update across all app instances

-- Create the level_progression_master table
CREATE TABLE IF NOT EXISTS level_progression_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL UNIQUE, -- Level number (1, 2, 3, etc.)
  xp_to_next INTEGER NOT NULL, -- XP required to reach the next level
  cumulative_xp INTEGER NOT NULL, -- Total XP required to reach this level
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT, -- Optional description for this level
  rewards TEXT[], -- Array of rewards for reaching this level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_level_progression_level ON level_progression_master(level);
CREATE INDEX IF NOT EXISTS idx_level_progression_active ON level_progression_master(is_active);
CREATE INDEX IF NOT EXISTS idx_level_progression_cumulative ON level_progression_master(cumulative_xp);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_level_progression_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_level_progression_timestamp_trigger ON level_progression_master;
CREATE TRIGGER update_level_progression_timestamp_trigger
  BEFORE UPDATE ON level_progression_master
  FOR EACH ROW
  EXECUTE FUNCTION update_level_progression_timestamp();

-- Insert initial level progression data
INSERT INTO level_progression_master (level, xp_to_next, cumulative_xp, description) VALUES
(1, 50, 0, 'Level 1 - Beginner Adventurer'),
(2, 83, 50, 'Level 2 - Novice Explorer'),
(3, 117, 133, 'Level 3 - Apprentice Warrior'),
(4, 150, 250, 'Level 4 - Skilled Fighter'),
(5, 183, 400, 'Level 5 - Experienced Hero'),
(6, 217, 583, 'Level 6 - Battle-Hardened Warrior'),
(7, 250, 800, 'Level 7 - Seasoned Fighter'),
(8, 283, 1050, 'Level 8 - Veteran Adventurer'),
(9, 317, 1333, 'Level 9 - Elite Warrior'),
(10, 350, 1650, 'Level 10 - Master Fighter'),
(11, 383, 2000, 'Level 11 - Legendary Hero'),
(12, 417, 2383, 'Level 12 - Epic Warrior'),
(13, 450, 2800, 'Level 13 - Mythical Fighter'),
(14, 483, 3250, 'Level 14 - Divine Hero'),
(15, 517, 3733, 'Level 15 - Immortal Warrior'),
(16, 550, 4250, 'Level 16 - Celestial Fighter'),
(17, 583, 4800, 'Level 17 - Cosmic Hero'),
(18, 617, 5383, 'Level 18 - Universal Warrior'),
(19, 650, 6000, 'Level 19 - Infinite Fighter'),
(20, 683, 6650, 'Level 20 - Eternal Hero'),
(21, 717, 7333, 'Level 21 - Timeless Warrior'),
(22, 750, 8050, 'Level 22 - Ageless Fighter'),
(23, 783, 8800, 'Level 23 - Perpetual Hero'),
(24, 817, 9583, 'Level 24 - Endless Warrior'),
(25, 850, 10400, 'Level 25 - Limitless Fighter'),
(26, 883, 11250, 'Level 26 - Boundless Hero'),
(27, 917, 12133, 'Level 27 - Infinite Warrior'),
(28, 950, 13050, 'Level 28 - Eternal Fighter'),
(29, 983, 14000, 'Level 29 - Immortal Hero'),
(30, 1017, 14983, 'Level 30 - Divine Warrior'),
(31, 1050, 16000, 'Level 31 - Celestial Fighter'),
(32, 1083, 17050, 'Level 32 - Cosmic Hero'),
(33, 1117, 18133, 'Level 33 - Universal Warrior'),
(34, 1150, 19250, 'Level 34 - Infinite Fighter'),
(35, 1183, 20400, 'Level 35 - Eternal Hero'),
(36, 1217, 21583, 'Level 36 - Timeless Warrior'),
(37, 1250, 22800, 'Level 37 - Ageless Fighter'),
(38, 1283, 24050, 'Level 38 - Perpetual Hero'),
(39, 1317, 25333, 'Level 39 - Endless Warrior'),
(40, 1350, 26650, 'Level 40 - Limitless Fighter'),
(41, 1383, 28000, 'Level 41 - Boundless Hero'),
(42, 1417, 29383, 'Level 42 - Infinite Warrior'),
(43, 1450, 30800, 'Level 43 - Eternal Fighter'),
(44, 1483, 32250, 'Level 44 - Immortal Hero'),
(45, 1517, 33733, 'Level 45 - Divine Warrior'),
(46, 1550, 35250, 'Level 46 - Celestial Fighter'),
(47, 1583, 36800, 'Level 47 - Cosmic Hero'),
(48, 1617, 38383, 'Level 48 - Universal Warrior'),
(49, 1650, 40000, 'Level 49 - Infinite Fighter'),
(50, 1683, 41650, 'Level 50 - Eternal Hero'),
(51, 1717, 43333, 'Level 51 - Timeless Warrior'),
(52, 1750, 45050, 'Level 52 - Ageless Fighter'),
(53, 1783, 46800, 'Level 53 - Perpetual Hero'),
(54, 1817, 48583, 'Level 54 - Endless Warrior'),
(55, 1850, 50400, 'Level 55 - Limitless Fighter'),
(56, 1883, 52250, 'Level 56 - Boundless Hero'),
(57, 1917, 54133, 'Level 57 - Infinite Warrior'),
(58, 1950, 56050, 'Level 58 - Eternal Fighter'),
(59, 1983, 58000, 'Level 59 - Immortal Hero'),
(60, 2017, 59983, 'Level 60 - Divine Warrior'),
(61, 2050, 62000, 'Level 61 - Celestial Fighter'),
(62, 2083, 64050, 'Level 62 - Cosmic Hero'),
(63, 2117, 66133, 'Level 63 - Universal Warrior'),
(64, 2150, 68250, 'Level 64 - Infinite Fighter'),
(65, 2183, 70400, 'Level 65 - Eternal Hero'),
(66, 2217, 72583, 'Level 66 - Timeless Warrior'),
(67, 2250, 74800, 'Level 67 - Ageless Fighter'),
(68, 2283, 77050, 'Level 68 - Perpetual Hero'),
(69, 2317, 79333, 'Level 69 - Endless Warrior'),
(70, 2350, 81650, 'Level 70 - Limitless Fighter'),
(71, 2383, 84000, 'Level 71 - Boundless Hero'),
(72, 2417, 86383, 'Level 72 - Infinite Warrior'),
(73, 2450, 88800, 'Level 73 - Eternal Fighter'),
(74, 2483, 91250, 'Level 74 - Immortal Hero'),
(75, 2517, 93733, 'Level 75 - Divine Warrior'),
(76, 2550, 96250, 'Level 76 - Celestial Fighter'),
(77, 2583, 98800, 'Level 77 - Cosmic Hero'),
(78, 2617, 101383, 'Level 78 - Universal Warrior'),
(79, 2650, 104000, 'Level 79 - Infinite Fighter'),
(80, 2683, 106650, 'Level 80 - Eternal Hero'),
(81, 2717, 109333, 'Level 81 - Timeless Warrior'),
(82, 2750, 112050, 'Level 82 - Ageless Fighter'),
(83, 2783, 114800, 'Level 83 - Perpetual Hero'),
(84, 2817, 117583, 'Level 84 - Endless Warrior'),
(85, 2850, 120400, 'Level 85 - Limitless Fighter'),
(86, 2883, 123250, 'Level 86 - Boundless Hero'),
(87, 2917, 126133, 'Level 87 - Infinite Warrior'),
(88, 2950, 129050, 'Level 88 - Eternal Fighter'),
(89, 2983, 132000, 'Level 89 - Immortal Hero'),
(90, 3017, 134983, 'Level 90 - Divine Warrior'),
(91, 3050, 138000, 'Level 91 - Celestial Fighter'),
(92, 3083, 141050, 'Level 92 - Cosmic Hero'),
(93, 3117, 144133, 'Level 93 - Universal Warrior'),
(94, 3150, 147250, 'Level 94 - Infinite Fighter'),
(95, 3183, 150400, 'Level 95 - Eternal Hero'),
(96, 3217, 153583, 'Level 96 - Timeless Warrior'),
(97, 3250, 156800, 'Level 97 - Ageless Fighter'),
(98, 3283, 160050, 'Level 98 - Perpetual Hero'),
(99, 3317, 163333, 'Level 99 - Endless Warrior')
ON CONFLICT (level) DO UPDATE SET
  xp_to_next = EXCLUDED.xp_to_next,
  cumulative_xp = EXCLUDED.cumulative_xp,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create RLS policies for the table
ALTER TABLE level_progression_master ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active level progression
CREATE POLICY "Allow read access to active level progression" ON level_progression_master
  FOR SELECT USING (is_active = true);

-- Allow only service role to manage level progression (for admin updates)
CREATE POLICY "Allow service role full access to level progression" ON level_progression_master
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the setup
SELECT 
  level,
  xp_to_next,
  cumulative_xp,
  description,
  is_active,
  created_at,
  updated_at
FROM level_progression_master
ORDER BY level
LIMIT 10;

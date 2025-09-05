-- Populate Level Progression Master Table
-- This script ensures the level_progression_master table has the correct data
-- based on the documentation in LEVEL_PROGRESSION_MANAGEMENT.md

-- First, clear any existing data to ensure consistency
TRUNCATE TABLE level_progression_master RESTART IDENTITY;

-- Insert the correct level progression data
-- Based on the documentation: Level 2 requires 50 cumulative XP
INSERT INTO level_progression_master (level, xp_to_next, cumulative_xp, description, is_active) VALUES
(1, 50, 0, 'Level 1 - Beginner Adventurer', true),
(2, 83, 50, 'Level 2 - Novice Explorer', true),
(3, 117, 133, 'Level 3 - Apprentice Warrior', true),
(4, 150, 250, 'Level 4 - Skilled Fighter', true),
(5, 183, 400, 'Level 5 - Experienced Hero', true),
(6, 217, 583, 'Level 6 - Seasoned Warrior', true),
(7, 250, 800, 'Level 7 - Battle-Hardened Fighter', true),
(8, 283, 1050, 'Level 8 - Elite Combatant', true),
(9, 317, 1333, 'Level 9 - Master Warrior', true),
(10, 350, 1650, 'Level 10 - Legendary Hero', true),
(11, 383, 2000, 'Level 11 - Champion of Light', true),
(12, 417, 2383, 'Level 12 - Guardian of Peace', true),
(13, 450, 2800, 'Level 13 - Protector of the Realm', true),
(14, 483, 3250, 'Level 14 - Defender of Justice', true),
(15, 517, 3733, 'Level 15 - Hero of Legend', true),
(16, 550, 4250, 'Level 16 - Master of Combat', true),
(17, 583, 4800, 'Level 17 - Warrior King', true),
(18, 617, 5383, 'Level 18 - Battle Master', true),
(19, 650, 6000, 'Level 19 - Combat Legend', true),
(20, 683, 6650, 'Level 20 - Ultimate Warrior', true),
(21, 717, 7333, 'Level 21 - Supreme Fighter', true),
(22, 750, 8050, 'Level 22 - Grand Champion', true),
(23, 783, 8800, 'Level 23 - Battle God', true),
(24, 817, 9583, 'Level 24 - War Master', true),
(25, 850, 10400, 'Level 25 - Legendary Champion', true),
(26, 883, 11250, 'Level 26 - Hero of Heroes', true),
(27, 917, 12133, 'Level 27 - Ultimate Champion', true),
(28, 950, 13050, 'Level 28 - Supreme Hero', true),
(29, 983, 14000, 'Level 29 - Grand Master', true),
(30, 1017, 14983, 'Level 30 - Legendary Master', true),
(31, 1050, 16000, 'Level 31 - Ultimate Master', true),
(32, 1083, 17050, 'Level 32 - Supreme Master', true),
(33, 1117, 18133, 'Level 33 - Grand Supreme', true),
(34, 1150, 19250, 'Level 34 - Legendary Supreme', true),
(35, 1183, 20400, 'Level 35 - Ultimate Supreme', true),
(36, 1217, 21583, 'Level 36 - Master Supreme', true),
(37, 1250, 22800, 'Level 37 - Champion Supreme', true),
(38, 1283, 24050, 'Level 38 - Hero Supreme', true),
(39, 1317, 25333, 'Level 39 - Warrior Supreme', true),
(40, 1350, 26650, 'Level 40 - Battle Supreme', true),
(41, 1383, 28000, 'Level 41 - Combat Supreme', true),
(42, 1417, 29383, 'Level 42 - War Supreme', true),
(43, 1450, 30800, 'Level 43 - Legend Supreme', true),
(44, 1483, 32250, 'Level 44 - Ultimate Legend', true),
(45, 1517, 33733, 'Level 45 - Supreme Legend', true),
(46, 1550, 35250, 'Level 46 - Grand Legend', true),
(47, 1583, 36800, 'Level 47 - Master Legend', true),
(48, 1617, 38383, 'Level 48 - Champion Legend', true),
(49, 1650, 40000, 'Level 49 - Hero Legend', true),
(50, 1683, 41650, 'Level 50 - Warrior Legend', true),
(51, 1717, 43333, 'Level 51 - Battle Legend', true),
(52, 1750, 45050, 'Level 52 - Combat Legend', true),
(53, 1783, 46800, 'Level 53 - War Legend', true),
(54, 1817, 48583, 'Level 54 - Ultimate War Legend', true),
(55, 1850, 50400, 'Level 55 - Supreme War Legend', true),
(56, 1883, 52250, 'Level 56 - Grand War Legend', true),
(57, 1917, 54133, 'Level 57 - Master War Legend', true),
(58, 1950, 56050, 'Level 58 - Champion War Legend', true),
(59, 1983, 58000, 'Level 59 - Hero War Legend', true),
(60, 2017, 59983, 'Level 60 - Warrior War Legend', true),
(61, 2050, 62000, 'Level 61 - Battle War Legend', true),
(62, 2083, 64050, 'Level 62 - Combat War Legend', true),
(63, 2117, 66133, 'Level 63 - Ultimate Combat Legend', true),
(64, 2150, 68250, 'Level 64 - Supreme Combat Legend', true),
(65, 2183, 70400, 'Level 65 - Grand Combat Legend', true),
(66, 2217, 72583, 'Level 66 - Master Combat Legend', true),
(67, 2250, 74800, 'Level 67 - Champion Combat Legend', true),
(68, 2283, 77050, 'Level 68 - Hero Combat Legend', true),
(69, 2317, 79333, 'Level 69 - Warrior Combat Legend', true),
(70, 2350, 81650, 'Level 70 - Battle Combat Legend', true),
(71, 2383, 84000, 'Level 71 - Ultimate Battle Legend', true),
(72, 2417, 86383, 'Level 72 - Supreme Battle Legend', true),
(73, 2450, 88800, 'Level 73 - Grand Battle Legend', true),
(74, 2483, 91250, 'Level 74 - Master Battle Legend', true),
(75, 2517, 93733, 'Level 75 - Champion Battle Legend', true),
(76, 2550, 96250, 'Level 76 - Hero Battle Legend', true),
(77, 2583, 98800, 'Level 77 - Warrior Battle Legend', true),
(78, 2617, 101383, 'Level 78 - Ultimate Warrior Legend', true),
(79, 2650, 104000, 'Level 79 - Supreme Warrior Legend', true),
(80, 2683, 106650, 'Level 80 - Grand Warrior Legend', true),
(81, 2717, 109333, 'Level 81 - Master Warrior Legend', true),
(82, 2750, 112050, 'Level 82 - Champion Warrior Legend', true),
(83, 2783, 114800, 'Level 83 - Hero Warrior Legend', true),
(84, 2817, 117583, 'Level 84 - Ultimate Hero Legend', true),
(85, 2850, 120400, 'Level 85 - Supreme Hero Legend', true),
(86, 2883, 123250, 'Level 86 - Grand Hero Legend', true),
(87, 2917, 126133, 'Level 87 - Master Hero Legend', true),
(88, 2950, 129050, 'Level 88 - Champion Hero Legend', true),
(89, 2983, 132000, 'Level 89 - Ultimate Champion Legend', true),
(90, 3017, 134983, 'Level 90 - Supreme Champion Legend', true),
(91, 3050, 138000, 'Level 91 - Grand Champion Legend', true),
(92, 3083, 141050, 'Level 92 - Master Champion Legend', true),
(93, 3117, 144133, 'Level 93 - Ultimate Master Legend', true),
(94, 3150, 147250, 'Level 94 - Supreme Master Legend', true),
(95, 3183, 150400, 'Level 95 - Grand Master Legend', true),
(96, 3217, 153583, 'Level 96 - Ultimate Grand Legend', true),
(97, 3250, 156800, 'Level 97 - Supreme Grand Legend', true),
(98, 3283, 160050, 'Level 98 - Master Grand Legend', true),
(99, 3317, 163333, 'Level 99 - Ultimate Grand Master Legend', true);

-- Verify the data was inserted correctly
SELECT 
  level,
  xp_to_next,
  cumulative_xp,
  description
FROM level_progression_master 
WHERE level <= 10
ORDER BY level;

-- Show the specific levels that matter for the current issue
SELECT 
  level,
  xp_to_next,
  cumulative_xp,
  description
FROM level_progression_master 
WHERE level IN (1, 2, 3, 4, 5)
ORDER BY level;

-- Count total levels
SELECT COUNT(*) as total_levels FROM level_progression_master WHERE is_active = true;

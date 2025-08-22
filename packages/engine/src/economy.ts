import { Action } from './actions';

// Rewards lookup table based on session duration
interface RewardTier {
  xpMin: number;
  xpMax: number;
  goldMin: number;
  goldMax: number;
  sparks: number;
}

const rewardsTable: Record<number, RewardTier> = {
  5: { xpMin: 5, xpMax: 6, goldMin: 3, goldMax: 3, sparks: 0 },
  10: { xpMin: 10, xpMax: 12, goldMin: 6, goldMax: 7, sparks: 0 },
  15: { xpMin: 16, xpMax: 18, goldMin: 9, goldMax: 10, sparks: 1 },
  20: { xpMin: 22, xpMax: 25, goldMin: 13, goldMax: 15, sparks: 1 },
  25: { xpMin: 28, xpMax: 32, goldMin: 16, goldMax: 19, sparks: 1 },
  30: { xpMin: 34, xpMax: 39, goldMin: 20, goldMax: 23, sparks: 2 },
  35: { xpMin: 41, xpMax: 47, goldMin: 24, goldMax: 28, sparks: 2 },
  40: { xpMin: 48, xpMax: 55, goldMin: 28, goldMax: 33, sparks: 2 },
  45: { xpMin: 55, xpMax: 63, goldMin: 33, goldMax: 37, sparks: 3 },
  50: { xpMin: 62, xpMax: 71, goldMin: 37, goldMax: 42, sparks: 3 },
  55: { xpMin: 70, xpMax: 80, goldMin: 42, goldMax: 48, sparks: 3 },
  60: { xpMin: 78, xpMax: 89, goldMin: 46, goldMax: 53, sparks: 4 },
  65: { xpMin: 86, xpMax: 98, goldMin: 51, goldMax: 58, sparks: 4 },
  70: { xpMin: 94, xpMax: 108, goldMin: 56, goldMax: 64, sparks: 4 },
  75: { xpMin: 103, xpMax: 118, goldMin: 61, goldMax: 70, sparks: 5 },
  80: { xpMin: 112, xpMax: 128, goldMin: 67, goldMax: 76, sparks: 5 },
  85: { xpMin: 121, xpMax: 138, goldMin: 72, goldMax: 82, sparks: 5 },
  90: { xpMin: 130, xpMax: 149, goldMin: 78, goldMax: 89, sparks: 6 },
  95: { xpMin: 140, xpMax: 160, goldMin: 84, goldMax: 96, sparks: 6 },
  100: { xpMin: 150, xpMax: 171, goldMin: 90, goldMax: 102, sparks: 6 },
  105: { xpMin: 158, xpMax: 180, goldMin: 94, goldMax: 108, sparks: 7 },
  110: { xpMin: 165, xpMax: 188, goldMin: 99, goldMax: 112, sparks: 7 },
  115: { xpMin: 172, xpMax: 197, goldMin: 103, goldMax: 118, sparks: 7 },
  120: { xpMin: 180, xpMax: 205, goldMin: 108, goldMax: 123, sparks: 8 },
};

// Helper function to find the appropriate reward tier for a given duration
const findRewardTier = (mins: number): RewardTier => {
  // Find the closest duration that's less than or equal to the actual duration
  const durations = Object.keys(rewardsTable).map(Number).sort((a, b) => a - b);
  let selectedDuration = durations[0]; // Default to 5 minutes
  
  for (const duration of durations) {
    if (mins >= duration) {
      selectedDuration = duration;
    } else {
      break;
    }
  }
  
  return rewardsTable[selectedDuration];
};

// Generate a random value within a range
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// XP Calculation - now uses lookup table
export const computeXP = (
  mins: number, 
  action: Action, 
  streakDays: number
): number => {
  const tier = findRewardTier(mins);
  const baseXP = randomInRange(tier.xpMin, tier.xpMax);
  
  // Apply action multiplier
  const actionMultiplier = sessionTypeMultiplier[action] || 1.0;
  
  // Apply streak multiplier
  const streakMultiplier = 1 + Math.min(streakDays, 7) * 0.02;
  
  return Math.round(baseXP * actionMultiplier * streakMultiplier);
};

// Session type multipliers for different actions
const sessionTypeMultiplier: Record<Action, number> = {
  Train: 1.00,
  Eat: 0.50,
  Learn: 1.05,
  Bathe: 0.40,
  Sleep: 0.25,
  Maintain: 0.80,
  Fight: 1.20,
  Adventure: 1.15,
};

// Coins Calculation - now uses lookup table
export const computeCoins = (mins: number): number => {
  const tier = findRewardTier(mins);
  return randomInRange(tier.goldMin, tier.goldMax);
};

// Sparks Calculation - now uses lookup table (subscribers only)
export const computeSparks = (
  mins: number, 
  isSubscribed: boolean
): number => {
  if (!isSubscribed) {
    return 0; // No sparks for non-subscribers
  }
  
  const tier = findRewardTier(mins);
  return tier.sparks;
};

// Level progression lookup table
// Level, XP to next Level, Cumulative XP
const levelProgressionTable: Record<number, { xpToNext: number; cumulativeXP: number }> = {
  1: { xpToNext: 50, cumulativeXP: 17 },
  2: { xpToNext: 83, cumulativeXP: 67 },
  3: { xpToNext: 117, cumulativeXP: 150 },
  4: { xpToNext: 150, cumulativeXP: 267 },
  5: { xpToNext: 183, cumulativeXP: 417 },
  6: { xpToNext: 217, cumulativeXP: 600 },
  7: { xpToNext: 250, cumulativeXP: 817 },
  8: { xpToNext: 283, cumulativeXP: 1067 },
  9: { xpToNext: 317, cumulativeXP: 1350 },
  10: { xpToNext: 350, cumulativeXP: 1667 },
  11: { xpToNext: 383, cumulativeXP: 2017 },
  12: { xpToNext: 417, cumulativeXP: 2400 },
  13: { xpToNext: 450, cumulativeXP: 2817 },
  14: { xpToNext: 483, cumulativeXP: 3267 },
  15: { xpToNext: 517, cumulativeXP: 3750 },
  16: { xpToNext: 550, cumulativeXP: 4267 },
  17: { xpToNext: 583, cumulativeXP: 4817 },
  18: { xpToNext: 617, cumulativeXP: 5400 },
  19: { xpToNext: 650, cumulativeXP: 6017 },
  20: { xpToNext: 683, cumulativeXP: 6667 },
  21: { xpToNext: 717, cumulativeXP: 7350 },
  22: { xpToNext: 750, cumulativeXP: 8067 },
  23: { xpToNext: 783, cumulativeXP: 8817 },
  24: { xpToNext: 817, cumulativeXP: 9600 },
  25: { xpToNext: 850, cumulativeXP: 10417 },
  26: { xpToNext: 883, cumulativeXP: 11267 },
  27: { xpToNext: 917, cumulativeXP: 12150 },
  28: { xpToNext: 950, cumulativeXP: 13067 },
  29: { xpToNext: 983, cumulativeXP: 14017 },
  30: { xpToNext: 1017, cumulativeXP: 15000 },
  31: { xpToNext: 1050, cumulativeXP: 16017 },
  32: { xpToNext: 1083, cumulativeXP: 17067 },
  33: { xpToNext: 1117, cumulativeXP: 18150 },
  34: { xpToNext: 1150, cumulativeXP: 19267 },
  35: { xpToNext: 1183, cumulativeXP: 20417 },
  36: { xpToNext: 1217, cumulativeXP: 21600 },
  37: { xpToNext: 1250, cumulativeXP: 22817 },
  38: { xpToNext: 1283, cumulativeXP: 24067 },
  39: { xpToNext: 1317, cumulativeXP: 25350 },
  40: { xpToNext: 1350, cumulativeXP: 26667 },
  41: { xpToNext: 1383, cumulativeXP: 28017 },
  42: { xpToNext: 1417, cumulativeXP: 29400 },
  43: { xpToNext: 1450, cumulativeXP: 30817 },
  44: { xpToNext: 1483, cumulativeXP: 32267 },
  45: { xpToNext: 1517, cumulativeXP: 33750 },
  46: { xpToNext: 1550, cumulativeXP: 35267 },
  47: { xpToNext: 1583, cumulativeXP: 36817 },
  48: { xpToNext: 1617, cumulativeXP: 38400 },
  49: { xpToNext: 1650, cumulativeXP: 40017 },
  50: { xpToNext: 1683, cumulativeXP: 41667 },
  51: { xpToNext: 1717, cumulativeXP: 43350 },
  52: { xpToNext: 1750, cumulativeXP: 45067 },
  53: { xpToNext: 1783, cumulativeXP: 46817 },
  54: { xpToNext: 1817, cumulativeXP: 48600 },
  55: { xpToNext: 1850, cumulativeXP: 50417 },
  56: { xpToNext: 1883, cumulativeXP: 52267 },
  57: { xpToNext: 1917, cumulativeXP: 54150 },
  58: { xpToNext: 1950, cumulativeXP: 56067 },
  59: { xpToNext: 1983, cumulativeXP: 58017 },
  60: { xpToNext: 2017, cumulativeXP: 60000 },
  61: { xpToNext: 2050, cumulativeXP: 62017 },
  62: { xpToNext: 2083, cumulativeXP: 64067 },
  63: { xpToNext: 2117, cumulativeXP: 66150 },
  64: { xpToNext: 2150, cumulativeXP: 68267 },
  65: { xpToNext: 2183, cumulativeXP: 70417 },
  66: { xpToNext: 2217, cumulativeXP: 72600 },
  67: { xpToNext: 2250, cumulativeXP: 74817 },
  68: { xpToNext: 2283, cumulativeXP: 77067 },
  69: { xpToNext: 2317, cumulativeXP: 79350 },
  70: { xpToNext: 2350, cumulativeXP: 81667 },
  71: { xpToNext: 2383, cumulativeXP: 84017 },
  72: { xpToNext: 2417, cumulativeXP: 86400 },
  73: { xpToNext: 2450, cumulativeXP: 88817 },
  74: { xpToNext: 2483, cumulativeXP: 91267 },
  75: { xpToNext: 2517, cumulativeXP: 93750 },
  76: { xpToNext: 2550, cumulativeXP: 96267 },
  77: { xpToNext: 2583, cumulativeXP: 98817 },
  78: { xpToNext: 2617, cumulativeXP: 101400 },
  79: { xpToNext: 2650, cumulativeXP: 104017 },
  80: { xpToNext: 2683, cumulativeXP: 106667 },
  81: { xpToNext: 2717, cumulativeXP: 109350 },
  82: { xpToNext: 2750, cumulativeXP: 112067 },
  83: { xpToNext: 2783, cumulativeXP: 114817 },
  84: { xpToNext: 2817, cumulativeXP: 117600 },
  85: { xpToNext: 2850, cumulativeXP: 120417 },
  86: { xpToNext: 2883, cumulativeXP: 123267 },
  87: { xpToNext: 2917, cumulativeXP: 126150 },
  88: { xpToNext: 2950, cumulativeXP: 129067 },
  89: { xpToNext: 2983, cumulativeXP: 132017 },
  90: { xpToNext: 3017, cumulativeXP: 135000 },
  91: { xpToNext: 3050, cumulativeXP: 138017 },
  92: { xpToNext: 3083, cumulativeXP: 141067 },
  93: { xpToNext: 3117, cumulativeXP: 144150 },
  94: { xpToNext: 3150, cumulativeXP: 147267 },
  95: { xpToNext: 3183, cumulativeXP: 150417 },
  96: { xpToNext: 3217, cumulativeXP: 153600 },
  97: { xpToNext: 3250, cumulativeXP: 156817 },
  98: { xpToNext: 3283, cumulativeXP: 160067 },
  99: { xpToNext: 3317, cumulativeXP: 163350 },
};

// Level calculation using lookup table
export const computeLevel = (xp: number): number => {
  // Find the highest level where cumulative XP is less than or equal to current XP
  for (let level = 99; level >= 1; level--) {
    if (xp >= levelProgressionTable[level].cumulativeXP) {
      return level;
    }
  }
  return 1; // Default to level 1 if XP is below the minimum
};

// XP needed for next level
export const xpForNextLevel = (currentLevel: number): number => {
  if (currentLevel >= 99) {
    return 0; // Max level reached
  }
  return levelProgressionTable[currentLevel].xpToNext;
};

// XP progress to next level (0-1)
export const xpProgressToNextLevel = (currentXP: number): number => {
  const currentLevel = computeLevel(currentXP);
  
  if (currentLevel >= 99) {
    return 1; // Max level reached
  }
  
  const currentLevelXP = levelProgressionTable[currentLevel].cumulativeXP;
  const nextLevelXP = levelProgressionTable[currentLevel + 1].cumulativeXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const xpProgress = currentXP - currentLevelXP;
  
  return Math.max(0, Math.min(1, xpProgress / xpNeeded));
};

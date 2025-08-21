"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xpProgressToNextLevel = exports.xpForNextLevel = exports.computeLevel = exports.computeSparks = exports.computeCoins = exports.computeXP = void 0;
const rewardsTable = {
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
const findRewardTier = (mins) => {
    // Find the closest duration that's less than or equal to the actual duration
    const durations = Object.keys(rewardsTable).map(Number).sort((a, b) => a - b);
    let selectedDuration = durations[0]; // Default to 5 minutes
    for (const duration of durations) {
        if (mins >= duration) {
            selectedDuration = duration;
        }
        else {
            break;
        }
    }
    return rewardsTable[selectedDuration];
};
// Generate a random value within a range
const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// XP Calculation - now uses lookup table
const computeXP = (mins, action, streakDays) => {
    const tier = findRewardTier(mins);
    const baseXP = randomInRange(tier.xpMin, tier.xpMax);
    // Apply action multiplier
    const actionMultiplier = sessionTypeMultiplier[action] || 1.0;
    // Apply streak multiplier
    const streakMultiplier = 1 + Math.min(streakDays, 7) * 0.02;
    return Math.round(baseXP * actionMultiplier * streakMultiplier);
};
exports.computeXP = computeXP;
// Session type multipliers for different actions
const sessionTypeMultiplier = {
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
const computeCoins = (mins) => {
    const tier = findRewardTier(mins);
    return randomInRange(tier.goldMin, tier.goldMax);
};
exports.computeCoins = computeCoins;
// Sparks Calculation - now uses lookup table (subscribers only)
const computeSparks = (mins, isSubscribed) => {
    if (!isSubscribed) {
        return 0; // No sparks for non-subscribers
    }
    const tier = findRewardTier(mins);
    return tier.sparks;
};
exports.computeSparks = computeSparks;
// Level calculation
const computeLevel = (xp) => {
    // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
    // Formula: level = 1 + floor((-1 + sqrt(1 + 8 * xp / 100)) / 2)
    return Math.max(1, Math.floor((-1 + Math.sqrt(1 + 8 * xp / 100)) / 2));
};
exports.computeLevel = computeLevel;
// XP needed for next level
const xpForNextLevel = (currentLevel) => {
    return (currentLevel * (currentLevel + 1) / 2) * 100;
};
exports.xpForNextLevel = xpForNextLevel;
// XP progress to next level (0-1)
const xpProgressToNextLevel = (currentXP) => {
    const currentLevel = (0, exports.computeLevel)(currentXP);
    const xpForCurrentLevel = (0, exports.xpForNextLevel)(currentLevel - 1);
    const xpForNext = (0, exports.xpForNextLevel)(currentLevel);
    return (currentXP - xpForCurrentLevel) / (xpForNext - xpForCurrentLevel);
};
exports.xpProgressToNextLevel = xpProgressToNextLevel;

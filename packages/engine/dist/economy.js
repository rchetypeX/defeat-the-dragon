"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xpProgressToNextLevel = exports.xpForNextLevel = exports.computeLevel = exports.computeSparks = exports.computeCoins = exports.computeXP = void 0;
// XP Calculation
const baseXPPerMin = 1;
const complexityMultiplier = (mins) => Math.min(1 + (mins / 50) * 0.25, 1.5);
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
const streakMultiplier = (days) => 1 + Math.min(days, 7) * 0.02;
const computeXP = (mins, action, streakDays) => Math.round(mins *
    baseXPPerMin *
    complexityMultiplier(mins) *
    sessionTypeMultiplier[action] *
    streakMultiplier(streakDays));
exports.computeXP = computeXP;
// Coins Calculation
const computeCoins = (xp) => Math.floor(xp * 0.6);
exports.computeCoins = computeCoins;
// Sparks Calculation (subscribers only)
const computeSparks = (mins, streakDays) => Math.floor(mins / 25) * (1 + Math.min(streakDays, 7) * 0.05);
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

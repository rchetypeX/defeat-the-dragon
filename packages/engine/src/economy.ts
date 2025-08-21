import { Action } from './actions';

// XP Calculation
const baseXPPerMin = 1;
const complexityMultiplier = (mins: number): number => 
  Math.min(1 + (mins / 50) * 0.25, 1.5);

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

const streakMultiplier = (days: number): number => 
  1 + Math.min(days, 7) * 0.02;

export const computeXP = (
  mins: number, 
  action: Action, 
  streakDays: number
): number =>
  Math.round(
    mins * 
    baseXPPerMin * 
    complexityMultiplier(mins) * 
    sessionTypeMultiplier[action] * 
    streakMultiplier(streakDays)
  );

// Coins Calculation
export const computeCoins = (xp: number): number => 
  Math.floor(xp * 0.6);

// Sparks Calculation (subscribers only)
export const computeSparks = (
  mins: number, 
  streakDays: number
): number => 
  Math.floor(mins / 25) * (1 + Math.min(streakDays, 7) * 0.05);

// Level calculation
export const computeLevel = (xp: number): number => {
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
  // Formula: level = 1 + floor((-1 + sqrt(1 + 8 * xp / 100)) / 2)
  return Math.max(1, Math.floor((-1 + Math.sqrt(1 + 8 * xp / 100)) / 2));
};

// XP needed for next level
export const xpForNextLevel = (currentLevel: number): number => {
  return (currentLevel * (currentLevel + 1) / 2) * 100;
};

// XP progress to next level (0-1)
export const xpProgressToNextLevel = (currentXP: number): number => {
  const currentLevel = computeLevel(currentXP);
  const xpForCurrentLevel = xpForNextLevel(currentLevel - 1);
  const xpForNext = xpForNextLevel(currentLevel);
  return (currentXP - xpForCurrentLevel) / (xpForNext - xpForCurrentLevel);
};

import { Action } from './actions';
export declare const computeXP: (mins: number, action: Action, streakDays: number) => number;
export declare const computeCoins: (xp: number) => number;
export declare const computeSparks: (mins: number, streakDays: number) => number;
export declare const computeLevel: (xp: number) => number;
export declare const xpForNextLevel: (currentLevel: number) => number;
export declare const xpProgressToNextLevel: (currentXP: number) => number;

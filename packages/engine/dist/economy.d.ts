import { Action } from './actions';
export declare const computeXP: (mins: number, action: Action, streakDays: number) => number;
export declare const computeCoins: (mins: number) => number;
export declare const computeSparks: (mins: number, isSubscribed: boolean) => number;
export declare const computeLevel: (xp: number) => number;
export declare const xpForNextLevel: (currentLevel: number) => number;
export declare const xpProgressToNextLevel: (currentXP: number) => number;

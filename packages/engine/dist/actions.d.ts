export type Action = "Train" | "Eat" | "Learn" | "Bathe" | "Sleep" | "Maintain" | "Fight" | "Adventure";
/**
 * Maps session duration in minutes to the corresponding action
 * Minutes (inclusive) → Action
 * 5–15 → Train
 * 16–30 → Eat
 * 31–45 → Learn
 * 46–60 → Bathe
 * 61–75 → Sleep
 * 76–90 → Maintain
 * 91–105 → Fight
 * 106–120 → Adventure
 */
export declare function actionForMinutes(minutes: number): Action;
/**
 * Get action metadata including emoji, description, and background theme
 */
export declare const actionMetadata: Record<Action, {
    emoji: string;
    label: string;
    description: string;
    background: string;
    idleAnimation: string;
}>;
/**
 * Get valid session durations (5-minute steps from 5 to 120)
 */
export declare function getValidDurations(): number[];
/**
 * Validate if a duration is supported
 */
export declare function isValidDuration(minutes: number): boolean;

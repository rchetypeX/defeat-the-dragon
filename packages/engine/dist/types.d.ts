import { z } from 'zod';
import { Action } from './actions';
export declare const SessionAction: z.ZodNativeEnum<{
    readonly Train: "Train";
    readonly Eat: "Eat";
    readonly Learn: "Learn";
    readonly Bathe: "Bathe";
    readonly Sleep: "Sleep";
    readonly Maintain: "Maintain";
    readonly Fight: "Fight";
    readonly Adventure: "Adventure";
}>;
export type SessionAction = Action;
export declare const SessionOutcome: z.ZodEnum<["success", "fail", "early_stop"]>;
export type SessionOutcome = z.infer<typeof SessionOutcome>;
export declare const BossTier: z.ZodEnum<["none", "mini", "big"]>;
export type BossTier = z.infer<typeof BossTier>;
export declare const PlayerClass: z.ZodEnum<["Fighter", "Rogue", "Wizard", "Cleric", "Ranger"]>;
export type PlayerClass = z.infer<typeof PlayerClass>;
export declare const MoodState: z.ZodEnum<["Warm", "Happy", "Excited", "Focused", "Determined"]>;
export type MoodState = z.infer<typeof MoodState>;
export declare const ProfileSchema: z.ZodObject<{
    user_id: z.ZodString;
    display_name: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    display_name: string;
    created_at: string;
}, {
    user_id: string;
    display_name: string;
    created_at: string;
}>;
export declare const PlayerSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    level: z.ZodNumber;
    xp: z.ZodNumber;
    coins: z.ZodNumber;
    sparks: z.ZodNumber;
    is_inspired: z.ZodBoolean;
    bond_score: z.ZodNumber;
    mood_state: z.ZodEnum<["Warm", "Happy", "Excited", "Focused", "Determined"]>;
    day_streak: z.ZodNumber;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    created_at: string;
    id: string;
    level: number;
    xp: number;
    coins: number;
    sparks: number;
    is_inspired: boolean;
    bond_score: number;
    mood_state: "Warm" | "Happy" | "Excited" | "Focused" | "Determined";
    day_streak: number;
}, {
    user_id: string;
    created_at: string;
    id: string;
    level: number;
    xp: number;
    coins: number;
    sparks: number;
    is_inspired: boolean;
    bond_score: number;
    mood_state: "Warm" | "Happy" | "Excited" | "Focused" | "Determined";
    day_streak: number;
}>;
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    action: z.ZodNativeEnum<{
        readonly Train: "Train";
        readonly Eat: "Eat";
        readonly Learn: "Learn";
        readonly Bathe: "Bathe";
        readonly Sleep: "Sleep";
        readonly Maintain: "Maintain";
        readonly Fight: "Fight";
        readonly Adventure: "Adventure";
    }>;
    started_at: z.ZodString;
    ended_at: z.ZodOptional<z.ZodString>;
    outcome: z.ZodOptional<z.ZodEnum<["success", "fail", "early_stop"]>>;
    disturbed_seconds: z.ZodDefault<z.ZodNumber>;
    dungeon_floor: z.ZodDefault<z.ZodNumber>;
    boss_tier: z.ZodDefault<z.ZodEnum<["none", "mini", "big"]>>;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    id: string;
    action: "Train" | "Eat" | "Learn" | "Bathe" | "Sleep" | "Maintain" | "Fight" | "Adventure";
    started_at: string;
    disturbed_seconds: number;
    dungeon_floor: number;
    boss_tier: "none" | "mini" | "big";
    ended_at?: string | undefined;
    outcome?: "success" | "fail" | "early_stop" | undefined;
}, {
    user_id: string;
    id: string;
    action: "Train" | "Eat" | "Learn" | "Bathe" | "Sleep" | "Maintain" | "Fight" | "Adventure";
    started_at: string;
    ended_at?: string | undefined;
    outcome?: "success" | "fail" | "early_stop" | undefined;
    disturbed_seconds?: number | undefined;
    dungeon_floor?: number | undefined;
    boss_tier?: "none" | "mini" | "big" | undefined;
}>;
export declare const InventorySchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    sku: z.ZodString;
    type: z.ZodEnum<["cosmetic", "pet", "trinket"]>;
    qty: z.ZodDefault<z.ZodNumber>;
    equipped: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "cosmetic" | "pet" | "trinket";
    user_id: string;
    id: string;
    sku: string;
    qty: number;
    equipped: boolean;
}, {
    type: "cosmetic" | "pet" | "trinket";
    user_id: string;
    id: string;
    sku: string;
    qty?: number | undefined;
    equipped?: boolean | undefined;
}>;
export declare const ShopItemSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    price_coins: z.ZodNumber;
    price_sparks: z.ZodNumber;
    type: z.ZodString;
    class_lock: z.ZodOptional<z.ZodString>;
    min_level: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: string;
    sku: string;
    name: string;
    price_coins: number;
    price_sparks: number;
    min_level: number;
    class_lock?: string | undefined;
}, {
    type: string;
    sku: string;
    name: string;
    price_coins: number;
    price_sparks: number;
    class_lock?: string | undefined;
    min_level?: number | undefined;
}>;
export declare const ClassSchema: z.ZodObject<{
    user_id: z.ZodString;
    class_id: z.ZodString;
    unlocked: z.ZodBoolean;
    quest_state: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    class_id: string;
    unlocked: boolean;
    quest_state: Record<string, any>;
}, {
    user_id: string;
    class_id: string;
    unlocked: boolean;
    quest_state: Record<string, any>;
}>;
export declare const LootSchema: z.ZodObject<{
    id: z.ZodString;
    session_id: z.ZodString;
    sku: z.ZodString;
    rarity: z.ZodEnum<["C", "U", "R", "SR", "SSR"]>;
}, "strip", z.ZodTypeAny, {
    rarity: "C" | "U" | "R" | "SR" | "SSR";
    id: string;
    sku: string;
    session_id: string;
}, {
    rarity: "C" | "U" | "R" | "SR" | "SSR";
    id: string;
    sku: string;
    session_id: string;
}>;
export declare const PushSubscriptionSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    endpoint: z.ZodString;
    p256dh: z.ZodString;
    auth: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
}, {
    user_id: string;
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
}>;
export declare const SubscriptionSchema: z.ZodObject<{
    user_id: z.ZodString;
    provider: z.ZodString;
    status: z.ZodString;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string;
    user_id: string;
    provider: string;
    expires_at?: string | undefined;
}, {
    status: string;
    user_id: string;
    provider: string;
    expires_at?: string | undefined;
}>;
export declare const StartSessionRequest: z.ZodObject<{
    action: z.ZodNativeEnum<{
        readonly Train: "Train";
        readonly Eat: "Eat";
        readonly Learn: "Learn";
        readonly Bathe: "Bathe";
        readonly Sleep: "Sleep";
        readonly Maintain: "Maintain";
        readonly Fight: "Fight";
        readonly Adventure: "Adventure";
    }>;
    duration_minutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    action: "Train" | "Eat" | "Learn" | "Bathe" | "Sleep" | "Maintain" | "Fight" | "Adventure";
    duration_minutes: number;
}, {
    action: "Train" | "Eat" | "Learn" | "Bathe" | "Sleep" | "Maintain" | "Fight" | "Adventure";
    duration_minutes: number;
}>;
export declare const StartSessionResponse: z.ZodObject<{
    session_id: z.ZodString;
    expected_end_time: z.ZodString;
    nonce: z.ZodString;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    expected_end_time: string;
    nonce: string;
}, {
    session_id: string;
    expected_end_time: string;
    nonce: string;
}>;
export declare const CompleteSessionRequest: z.ZodObject<{
    session_id: z.ZodString;
    actual_duration_minutes: z.ZodNumber;
    disturbed_seconds: z.ZodNumber;
    outcome: z.ZodEnum<["success", "fail", "early_stop"]>;
}, "strip", z.ZodTypeAny, {
    outcome: "success" | "fail" | "early_stop";
    disturbed_seconds: number;
    session_id: string;
    actual_duration_minutes: number;
}, {
    outcome: "success" | "fail" | "early_stop";
    disturbed_seconds: number;
    session_id: string;
    actual_duration_minutes: number;
}>;
export declare const CompleteSessionResponse: z.ZodObject<{
    xp_gained: z.ZodNumber;
    coins_gained: z.ZodNumber;
    sparks_gained: z.ZodNumber;
    level_up: z.ZodBoolean;
    new_level: z.ZodNumber;
    streak_updated: z.ZodBoolean;
    new_streak: z.ZodNumber;
    loot: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sku: z.ZodString;
        name: z.ZodString;
        rarity: z.ZodString;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        rarity: string;
        sku: string;
        name: string;
    }, {
        type: string;
        rarity: string;
        sku: string;
        name: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    xp_gained: number;
    coins_gained: number;
    sparks_gained: number;
    level_up: boolean;
    new_level: number;
    streak_updated: boolean;
    new_streak: number;
    loot?: {
        type: string;
        rarity: string;
        sku: string;
        name: string;
    }[] | undefined;
}, {
    xp_gained: number;
    coins_gained: number;
    sparks_gained: number;
    level_up: boolean;
    new_level: number;
    streak_updated: boolean;
    new_streak: number;
    loot?: {
        type: string;
        rarity: string;
        sku: string;
        name: string;
    }[] | undefined;
}>;
export declare const BossStartRequest: z.ZodObject<{
    boss_tier: z.ZodEnum<["none", "mini", "big"]>;
    duration_hours: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    boss_tier: "none" | "mini" | "big";
    duration_hours: number;
}, {
    boss_tier: "none" | "mini" | "big";
    duration_hours: number;
}>;
export declare const BossResolveRequest: z.ZodObject<{
    boss_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    boss_id: string;
}, {
    boss_id: string;
}>;
export declare const PushSubscribeRequest: z.ZodObject<{
    endpoint: z.ZodString;
    p256dh: z.ZodString;
    auth: z.ZodString;
}, "strip", z.ZodTypeAny, {
    endpoint: string;
    p256dh: string;
    auth: string;
}, {
    endpoint: string;
    p256dh: string;
    auth: string;
}>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type ShopItem = z.infer<typeof ShopItemSchema>;
export type Class = z.infer<typeof ClassSchema>;
export type Loot = z.infer<typeof LootSchema>;
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export interface GameState {
    player: Player;
    currentSession?: Session;
    inventory: Inventory[];
    classes: Class[];
    settings: {
        soundEnabled: boolean;
        notificationsEnabled: boolean;
        accessibility: {
            highContrast: boolean;
            dyslexiaFont: boolean;
            ttsEnabled: boolean;
        };
    };
}
export interface SessionProgress {
    sessionId: string;
    startTime: number;
    durationMinutes: number;
    elapsedSeconds: number;
    isActive: boolean;
    isDisturbed: boolean;
    disturbedSeconds: number;
}

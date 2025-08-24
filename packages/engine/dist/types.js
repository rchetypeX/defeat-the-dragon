"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscribeRequest = exports.BossResolveRequest = exports.BossStartRequest = exports.CompleteSessionResponse = exports.CompleteSessionRequest = exports.StartSessionResponse = exports.StartSessionRequest = exports.SubscriptionSchema = exports.PushSubscriptionSchema = exports.LootSchema = exports.ClassSchema = exports.ShopItemSchema = exports.InventorySchema = exports.SessionSchema = exports.PlayerSchema = exports.ProfileSchema = exports.MoodState = exports.PlayerClass = exports.BossTier = exports.SessionOutcome = exports.SessionAction = void 0;
const zod_1 = require("zod");
// Session types - now using the Action type from actions module
exports.SessionAction = zod_1.z.nativeEnum({
    Train: 'Train',
    Eat: 'Eat',
    Learn: 'Learn',
    Bathe: 'Bathe',
    Sleep: 'Sleep',
    Maintain: 'Maintain',
    Fight: 'Fight',
    Adventure: 'Adventure',
});
exports.SessionOutcome = zod_1.z.enum(['success', 'fail', 'early_stop']);
exports.BossTier = zod_1.z.enum(['none', 'mini', 'big']);
// Player types
exports.PlayerClass = zod_1.z.enum(['Fighter', 'Rogue', 'Wizard', 'Cleric', 'Ranger']);
exports.MoodState = zod_1.z.enum(['Warm', 'Happy', 'Excited', 'Focused', 'Determined']);
// Database schemas
exports.ProfileSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    display_name: zod_1.z.string().min(1).max(50),
    created_at: zod_1.z.string().datetime()
});
exports.PlayerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    level: zod_1.z.number().int().min(1),
    xp: zod_1.z.number().int().min(0),
    coins: zod_1.z.number().int().min(0),
    sparks: zod_1.z.number().int().min(0),
    created_at: zod_1.z.string().datetime(),
    display_name: zod_1.z.string().min(1).max(50).optional(),
    wallet_address: zod_1.z.string().optional()
});
exports.SessionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    action: exports.SessionAction,
    started_at: zod_1.z.string().datetime(),
    ended_at: zod_1.z.string().datetime().optional(),
    outcome: exports.SessionOutcome.optional(),
    disturbed_seconds: zod_1.z.number().int().min(0).default(0),
    dungeon_floor: zod_1.z.number().int().min(0).default(0),
    boss_tier: exports.BossTier.default('none')
});
exports.InventorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    sku: zod_1.z.string(),
    type: zod_1.z.enum(['cosmetic', 'pet', 'trinket']),
    qty: zod_1.z.number().int().min(1).default(1),
    equipped: zod_1.z.boolean().default(false)
});
exports.ShopItemSchema = zod_1.z.object({
    sku: zod_1.z.string(),
    name: zod_1.z.string(),
    price_coins: zod_1.z.number().int().min(0),
    price_sparks: zod_1.z.number().int().min(0),
    type: zod_1.z.string(),
    class_lock: zod_1.z.string().optional(),
    min_level: zod_1.z.number().int().min(1).default(1)
});
exports.ClassSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    class_id: zod_1.z.string(),
    unlocked: zod_1.z.boolean(),
    quest_state: zod_1.z.record(zod_1.z.any())
});
exports.LootSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    session_id: zod_1.z.string().uuid(),
    sku: zod_1.z.string(),
    rarity: zod_1.z.enum(['C', 'U', 'R', 'SR', 'SSR'])
});
exports.PushSubscriptionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    endpoint: zod_1.z.string().url(),
    p256dh: zod_1.z.string(),
    auth: zod_1.z.string()
});
exports.SubscriptionSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    provider: zod_1.z.string(),
    status: zod_1.z.string(),
    expires_at: zod_1.z.string().datetime().optional()
});
// API request/response schemas
exports.StartSessionRequest = zod_1.z.object({
    action: exports.SessionAction,
    duration_minutes: zod_1.z.number().int().min(5).max(120)
});
exports.StartSessionResponse = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    expected_end_time: zod_1.z.string().datetime(),
    nonce: zod_1.z.string()
});
exports.CompleteSessionRequest = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    actual_duration_minutes: zod_1.z.number().int().min(0),
    disturbed_seconds: zod_1.z.number().int().min(0),
    outcome: exports.SessionOutcome
});
exports.CompleteSessionResponse = zod_1.z.object({
    xp_gained: zod_1.z.number().int().min(0),
    coins_gained: zod_1.z.number().int().min(0),
    sparks_gained: zod_1.z.number().int().min(0),
    level_up: zod_1.z.boolean(),
    new_level: zod_1.z.number().int().min(1),
    loot: zod_1.z.array(zod_1.z.object({
        sku: zod_1.z.string(),
        name: zod_1.z.string(),
        rarity: zod_1.z.string(),
        type: zod_1.z.string()
    })).optional()
});
exports.BossStartRequest = zod_1.z.object({
    boss_tier: exports.BossTier,
    duration_hours: zod_1.z.number().int().min(1).max(24)
});
exports.BossResolveRequest = zod_1.z.object({
    boss_id: zod_1.z.string().uuid()
});
exports.PushSubscribeRequest = zod_1.z.object({
    endpoint: zod_1.z.string().url(),
    p256dh: zod_1.z.string(),
    auth: zod_1.z.string()
});

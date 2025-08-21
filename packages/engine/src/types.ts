import { z } from 'zod';
import { Action } from './actions';

// Session types - now using the Action type from actions module
export const SessionAction = z.nativeEnum({
  Train: 'Train',
  Eat: 'Eat',
  Learn: 'Learn',
  Bathe: 'Bathe',
  Sleep: 'Sleep',
  Maintain: 'Maintain',
  Fight: 'Fight',
  Adventure: 'Adventure',
} as const);
export type SessionAction = Action;

export const SessionOutcome = z.enum(['success', 'fail', 'early_stop']);
export type SessionOutcome = z.infer<typeof SessionOutcome>;

export const BossTier = z.enum(['none', 'mini', 'big']);
export type BossTier = z.infer<typeof BossTier>;

// Player types
export const PlayerClass = z.enum(['Fighter', 'Rogue', 'Wizard', 'Cleric', 'Ranger']);
export type PlayerClass = z.infer<typeof PlayerClass>;

export const MoodState = z.enum(['Warm', 'Happy', 'Excited', 'Focused', 'Determined']);
export type MoodState = z.infer<typeof MoodState>;

// Database schemas
export const ProfileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().min(1).max(50),
  created_at: z.string().datetime()
});

export const PlayerSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  level: z.number().int().min(1),
  xp: z.number().int().min(0),
  coins: z.number().int().min(0),
  sparks: z.number().int().min(0),
  is_inspired: z.boolean(),
  bond_score: z.number().int().min(0).max(100),
  mood_state: MoodState,
  day_streak: z.number().int().min(0),
  created_at: z.string().datetime(),
  display_name: z.string().min(1).max(50).optional()
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: SessionAction,
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().optional(),
  outcome: SessionOutcome.optional(),
  disturbed_seconds: z.number().int().min(0).default(0),
  dungeon_floor: z.number().int().min(0).default(0),
  boss_tier: BossTier.default('none')
});

export const InventorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  sku: z.string(),
  type: z.enum(['cosmetic', 'pet', 'trinket']),
  qty: z.number().int().min(1).default(1),
  equipped: z.boolean().default(false)
});

export const ShopItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  price_coins: z.number().int().min(0),
  price_sparks: z.number().int().min(0),
  type: z.string(),
  class_lock: z.string().optional(),
  min_level: z.number().int().min(1).default(1)
});

export const ClassSchema = z.object({
  user_id: z.string().uuid(),
  class_id: z.string(),
  unlocked: z.boolean(),
  quest_state: z.record(z.any())
});

export const LootSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  sku: z.string(),
  rarity: z.enum(['C', 'U', 'R', 'SR', 'SSR'])
});

export const PushSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string()
});

export const SubscriptionSchema = z.object({
  user_id: z.string().uuid(),
  provider: z.string(),
  status: z.string(),
  expires_at: z.string().datetime().optional()
});

// API request/response schemas
export const StartSessionRequest = z.object({
  action: SessionAction,
  duration_minutes: z.number().int().min(5).max(120)
});

export const StartSessionResponse = z.object({
  session_id: z.string().uuid(),
  expected_end_time: z.string().datetime(),
  nonce: z.string()
});

export const CompleteSessionRequest = z.object({
  session_id: z.string().uuid(),
  actual_duration_minutes: z.number().int().min(0),
  disturbed_seconds: z.number().int().min(0),
  outcome: SessionOutcome
});

export const CompleteSessionResponse = z.object({
  xp_gained: z.number().int().min(0),
  coins_gained: z.number().int().min(0),
  sparks_gained: z.number().int().min(0),
  level_up: z.boolean(),
  new_level: z.number().int().min(1),
  streak_updated: z.boolean(),
  new_streak: z.number().int().min(0),
  loot: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    rarity: z.string(),
    type: z.string()
  })).optional()
});

export const BossStartRequest = z.object({
  boss_tier: BossTier,
  duration_hours: z.number().int().min(1).max(24)
});

export const BossResolveRequest = z.object({
  boss_id: z.string().uuid()
});

export const PushSubscribeRequest = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string()
});

// Extract types from Zod schemas
export type Profile = z.infer<typeof ProfileSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type ShopItem = z.infer<typeof ShopItemSchema>;
export type Class = z.infer<typeof ClassSchema>;
export type Loot = z.infer<typeof LootSchema>;
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;

// Game state types
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

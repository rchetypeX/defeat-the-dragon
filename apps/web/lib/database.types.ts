export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          display_name: string
          created_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          created_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          user_id: string
          level: number
          xp: number
          coins: number
          sparks: number
          is_inspired: boolean
          bond_score: number
          mood_state: 'Warm' | 'Happy' | 'Excited' | 'Focused' | 'Determined'
          day_streak: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level?: number
          xp?: number
          coins?: number
          sparks?: number
          is_inspired?: boolean
          bond_score?: number
          mood_state?: 'Warm' | 'Happy' | 'Excited' | 'Focused' | 'Determined'
          day_streak?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: number
          xp?: number
          coins?: number
          sparks?: number
          is_inspired?: boolean
          bond_score?: number
          mood_state?: 'Warm' | 'Happy' | 'Excited' | 'Focused' | 'Determined'
          day_streak?: number
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          action: 'Train' | 'Quest_Study' | 'Learn' | 'Search' | 'Eat' | 'Sleep' | 'Bathe' | 'Maintain' | 'Fight' | 'Adventure'
          started_at: string
          ended_at: string | null
          outcome: 'success' | 'fail' | 'early_stop' | null
          disturbed_seconds: number
          dungeon_floor: number
          boss_tier: 'none' | 'mini' | 'big'
        }
        Insert: {
          id?: string
          user_id: string
          action: 'Train' | 'Quest_Study' | 'Learn' | 'Search' | 'Eat' | 'Sleep' | 'Bathe' | 'Maintain' | 'Fight' | 'Adventure'
          started_at?: string
          ended_at?: string | null
          outcome?: 'success' | 'fail' | 'early_stop' | null
          disturbed_seconds?: number
          dungeon_floor?: number
          boss_tier?: 'none' | 'mini' | 'big'
        }
        Update: {
          id?: string
          user_id?: string
          action?: 'Train' | 'Quest_Study' | 'Learn' | 'Search' | 'Eat' | 'Sleep' | 'Bathe' | 'Maintain' | 'Fight' | 'Adventure'
          started_at?: string
          ended_at?: string | null
          outcome?: 'success' | 'fail' | 'early_stop' | null
          disturbed_seconds?: number
          dungeon_floor?: number
          boss_tier?: 'none' | 'mini' | 'big'
        }
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          sku: string
          type: 'cosmetic' | 'pet' | 'trinket'
          qty: number
          equipped: boolean
        }
        Insert: {
          id?: string
          user_id: string
          sku: string
          type: 'cosmetic' | 'pet' | 'trinket'
          qty?: number
          equipped?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          sku?: string
          type?: 'cosmetic' | 'pet' | 'trinket'
          qty?: number
          equipped?: boolean
        }
      }
      shop_items: {
        Row: {
          sku: string
          name: string
          price_coins: number
          price_sparks: number
          type: string
          class_lock: string | null
          min_level: number
        }
        Insert: {
          sku: string
          name: string
          price_coins: number
          price_sparks: number
          type: string
          class_lock?: string | null
          min_level?: number
        }
        Update: {
          sku?: string
          name?: string
          price_coins?: number
          price_sparks?: number
          type?: string
          class_lock?: string | null
          min_level?: number
        }
      }
      classes: {
        Row: {
          user_id: string
          class_id: string
          unlocked: boolean
          quest_state: Json
        }
        Insert: {
          user_id: string
          class_id: string
          unlocked?: boolean
          quest_state?: Json
        }
        Update: {
          user_id?: string
          class_id?: string
          unlocked?: boolean
          quest_state?: Json
        }
      }
      loot: {
        Row: {
          id: string
          session_id: string
          sku: string
          rarity: 'C' | 'U' | 'R' | 'SR' | 'SSR'
        }
        Insert: {
          id?: string
          session_id: string
          sku: string
          rarity: 'C' | 'U' | 'R' | 'SR' | 'SSR'
        }
        Update: {
          id?: string
          session_id?: string
          sku?: string
          rarity?: 'C' | 'U' | 'R' | 'SR' | 'SSR'
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
        }
      }
      subscriptions: {
        Row: {
          user_id: string
          provider: string
          status: string
          expires_at: string | null
        }
        Insert: {
          user_id: string
          provider: string
          status: string
          expires_at?: string | null
        }
        Update: {
          user_id?: string
          provider?: string
          status?: string
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

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
      players: {
        Row: {
          id: string
          user_id: string
          wallet_address: string | null
          display_name: string | null
          level: number
          xp: number
          coins: number
          sparks: number
          is_inspired: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_address?: string | null
          display_name?: string | null
          level?: number
          xp?: number
          coins?: number
          sparks?: number
          is_inspired?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_address?: string | null
          display_name?: string | null
          level?: number
          xp?: number
          coins?: number
          sparks?: number
          is_inspired?: boolean
          created_at?: string
        }
      }
      shop_items_master: {
        Row: {
          id: string
          item_key: string
          name: string
          price: number
          currency: 'coins' | 'sparks'
          description: string | null
          image_url: string | null
          category: 'character' | 'background'
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_key: string
          name: string
          price: number
          currency: 'coins' | 'sparks'
          description?: string | null
          image_url?: string | null
          category: 'character' | 'background'
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_key?: string
          name?: string
          price?: number
          currency?: 'coins' | 'sparks'
          description?: string | null
          image_url?: string | null
          category?: 'character' | 'background'
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      character_dialogue_master: {
        Row: {
          id: string
          dialogue_text: string
          dialogue_type: 'general' | 'motivational' | 'achievement' | 'greeting'
          weight: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dialogue_text: string
          dialogue_type?: 'general' | 'motivational' | 'achievement' | 'greeting'
          weight?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dialogue_text?: string
          dialogue_type?: 'general' | 'motivational' | 'achievement' | 'greeting'
          weight?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      session_rewards_master: {
        Row: {
          id: string
          session_type: 'Train' | 'Quest_Study' | 'Learn' | 'Search' | 'Eat' | 'Sleep' | 'Bathe' | 'Maintain' | 'Fight' | 'Adventure'
          duration_minutes: number
          base_xp: number
          base_coins: number
          base_sparks: number
          bonus_multiplier: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_type: 'Train' | 'Quest_Study' | 'Learn' | 'Search' | 'Eat' | 'Sleep' | 'Bathe' | 'Maintain' | 'Fight' | 'Adventure'
          duration_minutes: number
          base_xp: number
          base_coins: number
          base_sparks: number
          bonus_multiplier?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_type?: 'Train' | 'Quest_Study' | 'Learn' | 'Search' | 'Eat' | 'Sleep' | 'Bathe' | 'Maintain' | 'Fight' | 'Adventure'
          duration_minutes?: number
          base_xp?: number
          base_coins?: number
          base_sparks?: number
          bonus_multiplier?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          action: 'Train' | 'Quest_Study' | 'Learn' | 'Search'
          started_at: string
          ended_at: string | null
          outcome: 'success' | 'fail' | 'early_stop' | null
        }
        Insert: {
          id?: string
          user_id: string
          action: 'Train' | 'Quest_Study' | 'Learn' | 'Search'
          started_at?: string
          ended_at?: string | null
          outcome?: 'success' | 'fail' | 'early_stop' | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: 'Train' | 'Quest_Study' | 'Learn' | 'Search'
          started_at?: string
          ended_at?: string | null
          outcome?: 'success' | 'fail' | 'early_stop' | null
        }
      }
      // subscriptions table removed - use user_subscriptions instead
      // shop_items table removed - use shop_items_master instead
      level_progression_master: {
        Row: {
          id: string
          level: number
          xp_to_next: number
          cumulative_xp: number
          is_active: boolean
          description: string | null
          rewards: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          level: number
          xp_to_next: number
          cumulative_xp: number
          is_active?: boolean
          description?: string | null
          rewards?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          level?: number
          xp_to_next?: number
          cumulative_xp?: number
          is_active?: boolean
          description?: string | null
          rewards?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_pricing_master: {
        Row: {
          id: string
          subscription_type: string
          price_eth: number
          price_usd: number
          price_usdc: number
          duration_days: number
          is_active: boolean
          description: string | null
          benefits: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscription_type: string
          price_eth?: number
          price_usd?: number
          price_usdc: number
          duration_days: number
          is_active?: boolean
          description?: string | null
          benefits?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscription_type?: string
          price_eth?: number
          price_usd?: number
          price_usdc?: number
          duration_days?: number
          is_active?: boolean
          description?: string | null
          benefits?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          sound_enabled: boolean
          notifications_enabled: boolean
          accessibility: Json
          equipped_character: string
          equipped_background: string
          updated_at: string
        }
        Insert: {
          user_id: string
          sound_enabled?: boolean
          notifications_enabled?: boolean
          accessibility?: Json
          equipped_character?: string
          equipped_background?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          sound_enabled?: boolean
          notifications_enabled?: boolean
          accessibility?: Json
          equipped_character?: string
          equipped_background?: string
          updated_at?: string
        }
      }
      user_inventory: {
        Row: {
          id: string
          user_id: string
          item_id: string
          item_type: 'cosmetic' | 'pet' | 'trinket' | 'character' | 'background'
          quantity: number
          equipped: boolean
          acquired_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          item_type: 'cosmetic' | 'pet' | 'trinket' | 'character' | 'background'
          quantity?: number
          equipped?: boolean
          acquired_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          item_type?: 'cosmetic' | 'pet' | 'trinket' | 'character' | 'background'
          quantity?: number
          equipped?: boolean
          acquired_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription_type: string
          status: string
          provider: string | null
          external_id: string | null
          started_at: string
          expires_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_type: string
          status?: string
          provider?: string | null
          external_id?: string | null
          started_at?: string
          expires_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_type?: string
          status?: string
          provider?: string | null
          external_id?: string | null
          started_at?: string
          expires_at?: string | null
          updated_at?: string
        }
      }
      user_purchases: {
        Row: {
          id: string
          user_id: string
          item_id: string
          item_type: string
          price_coins: number
          price_sparks: number
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          item_type: string
          price_coins?: number
          price_sparks?: number
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          item_type?: string
          price_coins?: number
          price_sparks?: number
          purchased_at?: string
        }
      }
      // user_achievements table removed - can be re-added when achievement system is implemented
    }
    Views: {
    }
    Functions: {
    }
    Enums: {
      [_ in never]: never
    }
  }
}

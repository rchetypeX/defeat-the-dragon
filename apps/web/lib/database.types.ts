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
          wallet_address: string | null
          display_name: string | null
          level: number
          xp: number
          coins: number
          sparks: number
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
          created_at?: string
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
      subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription_type: string
          status: string
          provider: string | null
          external_id: string | null
          started_at: string
          expires_at: string | null
          user_tag: string | null
          auto_tag_enabled: boolean
          created_at: string
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
          user_tag?: string | null
          auto_tag_enabled?: boolean
          created_at?: string
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
          user_tag?: string | null
          auto_tag_enabled?: boolean
          created_at?: string
        }
      }
      shop_items: {
        Row: {
          id: string
          sku: string
          name: string
          price: number
          price_sale: number
          type: string
          class_lock: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          price: number
          price_sale?: number
          type: string
          class_lock?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          price?: number
          price_sale?: number
          type?: string
          class_lock?: string | null
          is_active?: boolean
          created_by?: string | null
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
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: number
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: number
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: number
          completed?: boolean
          completed_at?: string | null
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

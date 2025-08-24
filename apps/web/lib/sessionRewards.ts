import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to calculate rewards based on session completion
export async function calculateSessionRewards(sessionType: string, durationMinutes: number, isSuccessful: boolean = true) {
  try {
    // Find the closest duration match (equal or next lower duration)
    const { data: rewards, error } = await supabase
      .from('session_rewards_master')
      .select('*')
      .eq('session_type', sessionType)
      .eq('is_active', true)
      .lte('duration_minutes', durationMinutes)
      .order('duration_minutes', { ascending: false })
      .limit(1);

    if (error || !rewards || rewards.length === 0) {
      // Fallback to default rewards if no match found
      return {
        xp: Math.floor(durationMinutes * 2),
        coins: Math.floor(durationMinutes * 0.8),
        sparks: Math.floor(durationMinutes * 0.2),
      };
    }

    const reward = rewards[0];
    const successMultiplier = isSuccessful ? 1.0 : 0.5; // Half rewards for failed sessions
    const durationMultiplier = durationMinutes / reward.duration_minutes; // Scale based on actual duration

    return {
      xp: Math.floor(reward.base_xp * reward.bonus_multiplier * successMultiplier * durationMultiplier),
      coins: Math.floor(reward.base_coins * reward.bonus_multiplier * successMultiplier * durationMultiplier),
      sparks: Math.floor(reward.base_sparks * reward.bonus_multiplier * successMultiplier * durationMultiplier),
    };

  } catch (error) {
    console.error('Error calculating session rewards:', error);
    // Return fallback rewards
    return {
      xp: Math.floor(durationMinutes * 2),
      coins: Math.floor(durationMinutes * 0.8),
      sparks: Math.floor(durationMinutes * 0.2),
    };
  }
}

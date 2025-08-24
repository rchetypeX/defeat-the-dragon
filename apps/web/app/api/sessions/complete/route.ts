import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  CompleteSessionRequest, 
  CompleteSessionResponse,
  computeXP,
  computeCoins,
  computeSparks,
  computeLevel,
  xpForNextLevel,
  xpProgressToNextLevel
} from '@defeat-the-dragon/engine';
// Moved calculateSessionRewards function inline to avoid import issues

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to calculate rewards based on session completion
async function calculateSessionRewards(sessionType: string, durationMinutes: number, isSuccessful: boolean = true) {
  try {
    // Use service role key for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the closest duration match (equal or next lower duration)
    const { data: rewards, error } = await adminSupabase
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

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the JWT token
    const token = authHeader.substring(7);
    
    // Check if this is a mock token for development
    if (token === 'mock-token-for-development') {
      console.log('API: Using mock token, skipping Supabase auth');
      // Continue with mock user data
    } else {
      // Verify the JWT token and get user info
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }

    // Create an authenticated client for this request
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = CompleteSessionRequest.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }

    const { session_id, actual_duration_minutes, disturbed_seconds, outcome } = validationResult.data;

    let session;
    let player;
    let user = null;

    if (token === 'mock-token-for-development') {
      // Use mock data for development
      session = {
        id: session_id,
        user_id: 'mock-user-id',
        action: 'Train',
        started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        ended_at: null,
        disturbed_seconds: disturbed_seconds,
        dungeon_floor: 0,
        boss_tier: 'none'
      };
      player = {
        id: 'mock-player-id',
        user_id: 'mock-user-id',
        level: 1,
        xp: 0,
        coins: 3,
        sparks: 0,
        is_inspired: false,
        created_at: new Date().toISOString()
      };
    } else {
      // Verify the JWT token and get user info first
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      user = authUser;

      // Get the session from the database
      const { data: dbSession, error: sessionError } = await authenticatedSupabase
        .from('sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !dbSession) {
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        );
      }
      session = dbSession;

      // Check if session is already completed
      if (session.ended_at) {
        return NextResponse.json(
          { error: 'Session already completed' },
          { status: 400 }
        );
      }

      // Get current player data
      const { data: dbPlayer, error: playerError } = await authenticatedSupabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (playerError || !dbPlayer) {
        return NextResponse.json(
          { error: 'Player data not found' },
          { status: 404 }
        );
      }
      player = dbPlayer;
    }

    // Calculate rewards based on outcome
    let xpGained = 0;
    let coinsGained = 0;
    let sparksGained = 0;
    let levelUp = false;
    let newLevel = player.level;


    if (outcome === 'success') {
      // Use dynamic rewards from master table
      const dynamicRewards = await calculateSessionRewards(
        session.action, 
        actual_duration_minutes, 
        true // successful session
      );
      
      xpGained = dynamicRewards.xp;
      coinsGained = dynamicRewards.coins;
      
      // Calculate Sparks for inspired users
      if (player.is_inspired) {
        sparksGained = dynamicRewards.sparks;
      } else {
        sparksGained = 0;
      }

      // Check for level up
      const newTotalXP = player.xp + xpGained;
      const newLevelCalculated = computeLevel(newTotalXP);
      levelUp = newLevelCalculated > player.level;
      newLevel = newLevelCalculated;
    } else if (outcome === 'fail' || outcome === 'early_stop') {
      // Use dynamic rewards with failure penalty
      const dynamicRewards = await calculateSessionRewards(
        session.action, 
        actual_duration_minutes, 
        false // failed session
      );
      
      xpGained = dynamicRewards.xp;
      coinsGained = dynamicRewards.coins;
      sparksGained = 0; // No sparks for failed sessions
      
      // Check for level up (unlikely with reduced rewards)
      const newTotalXP = player.xp + xpGained;
      const newLevelCalculated = computeLevel(newTotalXP);
      levelUp = newLevelCalculated > player.level;
      newLevel = newLevelCalculated;
    }

    // Update session and player data
    if (token === 'mock-token-for-development') {
      // For mock tokens, just simulate the update
      console.log('API: Mock session completion - simulating database updates');
    } else {
      // Update session with completion data
      const { error: updateSessionError } = await authenticatedSupabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          outcome,
          disturbed_seconds
        })
        .eq('id', session_id);

      if (updateSessionError) {
        console.error('Error updating session:', updateSessionError);
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500 }
        );
      }

      // Update player data
      const { error: updatePlayerError } = await authenticatedSupabase
        .from('players')
        .update({
          xp: player.xp + xpGained,
          coins: player.coins + coinsGained,
          sparks: player.sparks + sparksGained,
          level: newLevel
        })
        .eq('user_id', user?.id);

      if (updatePlayerError) {
        console.error('Error updating player:', updatePlayerError);
        return NextResponse.json(
          { error: 'Failed to update player data' },
          { status: 500 }
        );
      }
    }

    // Prepare the response
    const response: z.infer<typeof CompleteSessionResponse> = {
      xp_gained: xpGained,
      coins_gained: coinsGained,
      sparks_gained: sparksGained,
      level_up: levelUp,
      new_level: newLevel
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Session complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

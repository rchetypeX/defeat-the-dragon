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

// Initialize Supabase client for server-side operations (service role for bypassing RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    // Parse request body
    const body = await request.json();
    const { op_id, started_at, ended_at, action, context } = body;
    // disturbed_seconds removed as part of database cleanup

    // Validate required fields
    if (!op_id || !started_at || !ended_at || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: op_id, started_at, ended_at, action' },
        { status: 400 }
      );
    }

    // Check for idempotency - if we've seen this op_id before, return the previous response
    const { data: existingOp } = await supabase
      .from('ops_seen')
      .select('response_data')
      .eq('op_id', op_id)
      .single();

    if (existingOp) {
      console.log('Session complete: Returning cached response for op_id:', op_id);
      return NextResponse.json(existingOp.response_data);
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }
    
    let userId: string | null = null;
    
    // Handle different auth token types
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token.startsWith('wallet:')) {
        try {
          const walletData = JSON.parse(token.substring(7));
          userId = walletData.id;
          console.log('Session complete: Wallet user detected, user ID:', userId);
        } catch (e) {
          console.error('Session complete: Error parsing wallet token:', e);
          return NextResponse.json(
            { error: 'Invalid wallet token format' },
            { status: 401 }
          );
        }
      } else if (token.startsWith('baseapp:')) {
        try {
          const baseAppData = JSON.parse(token.substring(8));
          userId = baseAppData.id;
          console.log('Session complete: Base App user detected, user ID:', userId);
        } catch (e) {
          console.error('Session complete: Error parsing Base App token:', e);
          return NextResponse.json(
            { error: 'Invalid Base App token format' },
            { status: 401 }
          );
        }
      } else {
        // It's a Supabase token, verify it
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            userId = user.id;
            console.log('Session complete: Supabase user detected, user ID:', userId);
          } else {
            console.error('Session complete: Invalid Supabase token:', error);
            return NextResponse.json(
              { error: 'Invalid Supabase token' },
              { status: 401 }
            );
          }
        } catch (e) {
          console.error('Session complete: Error verifying Supabase token:', e);
          return NextResponse.json(
            { error: 'Invalid Supabase token' },
            { status: 401 }
          );
        }
      }
    } else if (authHeader.startsWith('wallet:')) {
      try {
        const walletData = JSON.parse(authHeader.substring(7));
        userId = walletData.id;
        console.log('Session complete: Wallet user detected, user ID:', userId);
      } catch (e) {
        console.error('Session complete: Error parsing wallet token:', e);
        return NextResponse.json(
          { error: 'Invalid wallet token format' },
          { status: 401 }
        );
      }
    } else if (authHeader.startsWith('baseapp:')) {
      try {
        const baseAppData = JSON.parse(authHeader.substring(8));
        userId = baseAppData.id;
        console.log('Session complete: Base App user detected, user ID:', userId);
      } catch (e) {
        console.error('Session complete: Error parsing Base App token:', e);
        return NextResponse.json(
          { error: 'Invalid Base App token format' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'No valid user found' },
        { status: 401 }
      );
    }

    // Calculate session duration
    const startTime = new Date(started_at);
    const endTime = new Date(ended_at);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Validate duration (prevent backdating and ensure reasonable duration)
    const now = new Date();
    const maxBackdateMinutes = 10; // Allow 10 minutes of backdating
    const maxDurationMinutes = 480; // 8 hours max

    if (endTime > now) {
      return NextResponse.json(
        { error: 'Session end time cannot be in the future' },
        { status: 400 }
      );
    }

    if (endTime < new Date(now.getTime() - maxBackdateMinutes * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Session end time is too far in the past' },
        { status: 400 }
      );
    }

    if (durationMinutes < 0 || durationMinutes > maxDurationMinutes) {
      return NextResponse.json(
        { error: 'Invalid session duration' },
        { status: 400 }
      );
    }

    // Get current player data
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (playerError || !player) {
      console.error('Session complete: Error fetching player data:', playerError);
      return NextResponse.json(
        { error: 'Player data not found' },
        { status: 404 }
      );
    }

    // Calculate rewards
    const rewards = await calculateSessionRewards(action, durationMinutes, true);
    
    // Calculate new values
    const newXP = player.xp + rewards.xp;
    const newCoins = player.coins + rewards.coins;
    const newSparks = player.sparks + rewards.sparks;
    const newLevel = computeLevel(newXP);
    const levelUp = newLevel > player.level;

    // Update player data
    const { error: updateError } = await supabase
      .from('players')
      .update({
        xp: newXP,
        coins: newCoins,
        sparks: newSparks,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Session complete: Error updating player data:', updateError);
      return NextResponse.json(
        { error: 'Failed to update player data' },
        { status: 500 }
      );
    }

    // Record the operation as seen for idempotency
    await supabase
      .from('ops_seen')
      .insert({
        op_id,
        user_id: userId,
        operation_type: 'session_complete',
        created_at: new Date().toISOString()
      })
      .single();

    // Prepare response
    const response = {
      xp_delta: rewards.xp,
      coins_delta: rewards.coins,
      sparks_delta: rewards.sparks,
      level_up: levelUp,
      player: {
        level: newLevel,
        xp: newXP,
        coins: newCoins,
        sparks: newSparks,
        display_name: player.display_name
      }
    };

    // Store the response for idempotency
    await supabase
      .from('ops_seen')
      .update({ response_data: response })
      .eq('op_id', op_id);

    console.log('Session complete: Successfully completed session for user:', userId);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Session complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

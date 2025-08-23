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

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      // Calculate XP based on actual duration and action
      xpGained = computeXP(actual_duration_minutes, session.action, 0);
      coinsGained = computeCoins(actual_duration_minutes);
      
      // Sparks are not implemented yet (subscription feature)
      sparksGained = 0;

      // Check for level up
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

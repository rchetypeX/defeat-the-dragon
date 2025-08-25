import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get('session_type');
    const durationMinutes = searchParams.get('duration_minutes');

    let query = supabase
      .from('session_rewards_master')
      .select('*')
      .eq('is_active', true)
      .order('session_type', { ascending: true })
      .order('duration_minutes', { ascending: true });

    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }

    if (durationMinutes) {
      query = query.eq('duration_minutes', parseInt(durationMinutes));
    }

    const { data: rewards, error } = await query;

    if (error) {
      console.error('Error fetching session rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session rewards' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: rewards,
    });

    // Add caching headers to reduce Edge Requests
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hour
    response.headers.set('ETag', `"session-rewards-${Date.now()}"`);

    return response;

  } catch (error) {
    console.error('Session rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      session_type, 
      duration_minutes, 
      base_xp, 
      base_coins, 
      base_sparks, 
      bonus_multiplier 
    } = body;

    if (!session_type || !duration_minutes || base_xp === undefined || base_coins === undefined || base_sparks === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newReward, error } = await supabase
      .from('session_rewards_master')
      .insert({
        session_type,
        duration_minutes,
        base_xp,
        base_coins,
        base_sparks,
        bonus_multiplier: bonus_multiplier || 1.0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session reward:', error);
      return NextResponse.json(
        { error: 'Failed to create session reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newReward,
    });

  } catch (error) {
    console.error('Session rewards POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }

    const { data: updatedReward, error } = await supabase
      .from('session_rewards_master')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session reward:', error);
      return NextResponse.json(
        { error: 'Failed to update session reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReward,
    });

  } catch (error) {
    console.error('Session rewards PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: calculateSessionRewards function moved to /lib/sessionRewards.ts

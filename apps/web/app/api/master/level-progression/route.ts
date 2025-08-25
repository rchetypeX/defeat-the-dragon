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
      .from('level_progression_master')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true });

    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }

    if (durationMinutes) {
      query = query.eq('duration_minutes', parseInt(durationMinutes));
    }

    const { data: progression, error } = await query;

    if (error) {
      console.error('Error fetching level progression:', error);
      return NextResponse.json(
        { error: 'Failed to fetch level progression' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: progression,
    });

    // Add caching headers to reduce Edge Requests
    response.headers.set('Cache-Control', 'public, max-age=1800, s-maxage=1800'); // 30 minutes
    response.headers.set('ETag', `"level-progression-${Date.now()}"`);

    return response;

  } catch (error) {
    console.error('Level progression API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add POST endpoint for admin updates (protected by service role)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, xp_to_next, cumulative_xp, description, rewards, is_active } = body;

    // Validate required fields
    if (!level || xp_to_next === undefined || cumulative_xp === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: level, xp_to_next, cumulative_xp' },
        { status: 400 }
      );
    }

    // Update or insert level progression
    const { data, error } = await supabase
      .from('level_progression_master')
      .upsert({
        level,
        xp_to_next,
        cumulative_xp,
        description,
        rewards,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating level progression:', error);
      return NextResponse.json(
        { error: 'Failed to update level progression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Level progression update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

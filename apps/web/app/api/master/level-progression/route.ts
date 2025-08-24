import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get level progression from master table
    const { data: progression, error } = await supabase
      .from('level_progression_master')
      .select('*')
      .eq('is_active', true)
      .order('level');

    if (error) {
      console.error('Error fetching level progression:', error);
      return NextResponse.json(
        { error: 'Failed to fetch level progression' },
        { status: 500 }
      );
    }

    // Transform data for easier consumption
    const progressionMap = progression.reduce((acc, item) => {
      acc[item.level] = {
        id: item.id,
        level: item.level,
        xp_to_next: item.xp_to_next,
        cumulative_xp: item.cumulative_xp,
        description: item.description,
        rewards: item.rewards || [],
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
      return acc;
    }, {} as Record<number, any>);

    return NextResponse.json({
      success: true,
      data: progressionMap
    });

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

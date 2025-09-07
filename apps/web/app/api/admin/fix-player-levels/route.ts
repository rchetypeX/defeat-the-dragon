import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateLevel } from '../../../../lib/levelUtils';

// Initialize Supabase client for server-side operations (service role for bypassing RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get all players
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('user_id, level, xp')
      .order('xp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching players:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    if (!players || players.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No players found',
        results: []
      });
    }

    const results = [];
    const updates = [];

    // Calculate correct levels for each player
    for (const player of players) {
      try {
        const levelCalculation = await calculateLevel(player.xp);
        const correctLevel = levelCalculation.currentLevel;
        
        const needsUpdate = correctLevel !== player.level;
        
        results.push({
          user_id: player.user_id,
          current_level: player.level,
          correct_level: correctLevel,
          xp: player.xp,
          needs_update: needsUpdate
        });

        if (needsUpdate) {
          updates.push({
            user_id: player.user_id,
            level: correctLevel
          });
        }
      } catch (error) {
        console.error(`Error calculating level for player ${player.user_id}:`, error);
        results.push({
          user_id: player.user_id,
          current_level: player.level,
          correct_level: player.level, // Keep current level if calculation fails
          xp: player.xp,
          needs_update: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update players that need level corrections
    let updateResults = [];
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ 
            level: update.level,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', update.user_id);

        updateResults.push({
          user_id: update.user_id,
          success: !updateError,
          error: updateError?.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${players.length} players, updated ${updates.length} levels`,
      results,
      updates: updateResults,
      summary: {
        total_players: players.length,
        players_updated: updates.length,
        players_unchanged: players.length - updates.length
      }
    });

  } catch (error) {
    console.error('Fix player levels error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all players with their current levels
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('user_id, level, xp, updated_at')
      .order('xp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching players:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    if (!players || players.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No players found',
        players: []
      });
    }

    // Calculate what the correct levels should be
    const playersWithCorrectLevels = [];
    for (const player of players) {
      try {
        const levelCalculation = await calculateLevel(player.xp);
        playersWithCorrectLevels.push({
          ...player,
          correct_level: levelCalculation.currentLevel,
          needs_update: levelCalculation.currentLevel !== player.level
        });
      } catch (error) {
        playersWithCorrectLevels.push({
          ...player,
          correct_level: player.level,
          needs_update: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const needsUpdate = playersWithCorrectLevels.filter(p => p.needs_update);

    return NextResponse.json({
      success: true,
      total_players: players.length,
      players_needing_update: needsUpdate.length,
      players: playersWithCorrectLevels,
      summary: {
        level_distribution: playersWithCorrectLevels.reduce((acc, player) => {
          acc[player.level] = (acc[player.level] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      }
    });

  } catch (error) {
    console.error('Get player levels error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

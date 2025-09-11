#!/usr/bin/env node

/**
 * Fix Player Levels Script
 * This script recalculates all player levels using the correct level progression system
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Level progression data (from populate_level_progression_master.sql)
const levelProgression = {
  1: { cumulative_xp: 0, xp_to_next: 50 },
  2: { cumulative_xp: 50, xp_to_next: 83 },
  3: { cumulative_xp: 133, xp_to_next: 117 },
  4: { cumulative_xp: 250, xp_to_next: 150 },
  5: { cumulative_xp: 400, xp_to_next: 183 },
  6: { cumulative_xp: 583, xp_to_next: 217 },
  7: { cumulative_xp: 800, xp_to_next: 250 },
  8: { cumulative_xp: 1050, xp_to_next: 283 },
  9: { cumulative_xp: 1333, xp_to_next: 317 },
  10: { cumulative_xp: 1650, xp_to_next: 350 }
};

function calculateLevel(totalXp) {
  let currentLevel = 1;
  
  // Find the highest level where cumulative XP is less than or equal to current XP
  for (let level = 99; level >= 1; level--) {
    const levelData = levelProgression[level];
    if (!levelData) continue;
    
    if (totalXp >= levelData.cumulative_xp) {
      currentLevel = level;
      break;
    }
  }
  
  return currentLevel;
}

async function fixPlayerLevels() {
  try {
    console.log('🔍 Fetching current player data...');
    
    // Get all players
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('user_id, level, xp, updated_at')
      .order('xp', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching players:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${players.length} players`);
    
    // Show current state
    console.log('\n📋 Current player levels:');
    players.forEach(player => {
      const correctLevel = calculateLevel(player.xp);
      const needsUpdate = correctLevel !== player.level;
      console.log(`  User ${player.user_id.slice(0, 8)}... | Level: ${player.level} | XP: ${player.xp} | Correct: ${correctLevel} | ${needsUpdate ? '❌ Needs Update' : '✅ Correct'}`);
    });
    
    // Update players with incorrect levels
    const playersToUpdate = players.filter(player => calculateLevel(player.xp) !== player.level);
    
    if (playersToUpdate.length === 0) {
      console.log('\n✅ All player levels are correct!');
      return;
    }
    
    console.log(`\n🔧 Updating ${playersToUpdate.length} players...`);
    
    for (const player of playersToUpdate) {
      const correctLevel = calculateLevel(player.xp);
      
      const { error: updateError } = await supabase
        .from('players')
        .update({
          level: correctLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', player.user_id);
      
      if (updateError) {
        console.error(`❌ Error updating player ${player.user_id}:`, updateError);
      } else {
        console.log(`✅ Updated player ${player.user_id.slice(0, 8)}... from level ${player.level} to level ${correctLevel} (${player.xp} XP)`);
      }
    }
    
    console.log('\n🎉 Level fix completed!');
    
    // Show final state
    console.log('\n📊 Final player levels:');
    const { data: finalPlayers } = await supabase
      .from('players')
      .select('user_id, level, xp')
      .order('xp', { ascending: false });
    
    finalPlayers.forEach(player => {
      console.log(`  User ${player.user_id.slice(0, 8)}... | Level: ${player.level} | XP: ${player.xp}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing player levels:', error);
  }
}

// Run the fix
fixPlayerLevels();

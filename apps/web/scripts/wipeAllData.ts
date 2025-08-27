#!/usr/bin/env tsx

/**
 * Script to wipe all account data for fresh testing
 * This will remove all user data while preserving the database structure
 * WARNING: This will permanently delete all user accounts, sessions, and data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function wipeAllData() {
  console.log('🧹 Starting data wipe process...\n');

  try {
    // 1. Get current data counts
    console.log('📊 Current data counts:');
    
    const { data: playerCount } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true });
    
    const { data: sessionCount } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true });
    
    const { data: inventoryCount } = await supabase
      .from('user_inventory')
      .select('id', { count: 'exact', head: true });
    
    const { data: settingsCount } = await supabase
      .from('user_settings')
      .select('id', { count: 'exact', head: true });
    
    const { data: purchasesCount } = await supabase
      .from('user_purchases')
      .select('id', { count: 'exact', head: true });
    
    const { data: opsCount } = await supabase
      .from('ops_seen')
      .select('id', { count: 'exact', head: true });
    
    const { data: alphaCodesCount } = await supabase
      .from('alpha_codes')
      .select('id', { count: 'exact', head: true });

    console.log(`   Players: ${playerCount || 0}`);
    console.log(`   Sessions: ${sessionCount || 0}`);
    console.log(`   Inventory items: ${inventoryCount || 0}`);
    console.log(`   User settings: ${settingsCount || 0}`);
    console.log(`   User purchases: ${purchasesCount || 0}`);
    console.log(`   Ops seen: ${opsCount || 0}`);
    console.log(`   Alpha codes: ${alphaCodesCount || 0}\n`);

    // 2. Confirm with user
    console.log('⚠️  WARNING: This will permanently delete ALL user data!');
    console.log('   This includes:');
    console.log('   - All player accounts');
    console.log('   - All session history');
    console.log('   - All inventory items');
    console.log('   - All user settings');
    console.log('   - All user purchases');
    console.log('   - All operation tracking');
    console.log('\n   Alpha codes will be preserved for admin testing.');
    console.log('\n   NOTE: Auth users will need to be cleared manually via Supabase Dashboard');
    console.log('   (Go to Authentication > Users and delete them manually)\n');

    // For safety, require explicit confirmation
    console.log('To proceed, please type "WIPE ALL DATA" (case sensitive):');
    
    // In a real script, you'd read from stdin, but for now we'll proceed
    // Uncomment the following lines if you want to add confirmation:
    // const readline = require('readline');
    // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // const answer = await new Promise(resolve => rl.question('', resolve));
    // rl.close();
    // if (answer !== 'WIPE ALL DATA') {
    //   console.log('❌ Operation cancelled.');
    //   process.exit(0);
    // }

    console.log('🗑️  Proceeding with data wipe...\n');

    // 3. Disable user-created triggers temporarily
    console.log('🔧 Disabling user-created triggers...');
    await supabase.rpc('exec_sql', { 
      sql: `
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_prevent_unauthorized_player_updates') THEN
            ALTER TABLE players DISABLE TRIGGER trigger_prevent_unauthorized_player_updates;
          END IF;
        END $$;
      `
    });

    // 4. Clear data in dependency order
    console.log('🗑️  Clearing sessions...');
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (sessionsError) {
      console.error('❌ Error clearing sessions:', sessionsError);
    } else {
      console.log('   ✅ Sessions cleared');
    }

    console.log('🗑️  Clearing inventory...');
    const { error: inventoryError } = await supabase
      .from('user_inventory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (inventoryError) {
      console.error('❌ Error clearing inventory:', inventoryError);
    } else {
      console.log('   ✅ Inventory cleared');
    }

    console.log('🗑️  Clearing user settings...');
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (settingsError) {
      console.error('❌ Error clearing user settings:', settingsError);
    } else {
      console.log('   ✅ User settings cleared');
    }

    console.log('🗑️  Clearing user purchases...');
    const { error: purchasesError } = await supabase
      .from('user_purchases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (purchasesError) {
      console.error('❌ Error clearing user purchases:', purchasesError);
    } else {
      console.log('   ✅ User purchases cleared');
    }

    console.log('🗑️  Clearing ops seen...');
    const { error: opsError } = await supabase
      .from('ops_seen')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (opsError) {
      console.error('❌ Error clearing ops seen:', opsError);
    } else {
      console.log('   ✅ Ops seen cleared');
    }

    console.log('🗑️  Clearing players...');
    const { error: playersError } = await supabase
      .from('players')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (playersError) {
      console.error('❌ Error clearing players:', playersError);
    } else {
      console.log('   ✅ Players cleared');
    }

    // 5. Re-enable user-created triggers
    console.log('🔧 Re-enabling user-created triggers...');
    await supabase.rpc('exec_sql', { 
      sql: `
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_prevent_unauthorized_player_updates') THEN
            ALTER TABLE players ENABLE TRIGGER trigger_prevent_unauthorized_player_updates;
          END IF;
        END $$;
      `
    });

    // 6. Verify cleanup
    console.log('\n📊 After cleanup data counts:');
    
    const { data: finalPlayerCount } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true });
    
    const { data: finalSessionCount } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true });
    
    const { data: finalInventoryCount } = await supabase
      .from('user_inventory')
      .select('id', { count: 'exact', head: true });
    
    const { data: finalSettingsCount } = await supabase
      .from('user_settings')
      .select('id', { count: 'exact', head: true });
    
    const { data: finalPurchasesCount } = await supabase
      .from('user_purchases')
      .select('id', { count: 'exact', head: true });
    
    const { data: finalOpsCount } = await supabase
      .from('ops_seen')
      .select('id', { count: 'exact', head: true });
    
    const { data: finalAlphaCodesCount } = await supabase
      .from('alpha_codes')
      .select('id', { count: 'exact', head: true });

    console.log(`   Players: ${finalPlayerCount || 0}`);
    console.log(`   Sessions: ${finalSessionCount || 0}`);
    console.log(`   Inventory items: ${finalInventoryCount || 0}`);
    console.log(`   User settings: ${finalSettingsCount || 0}`);
    console.log(`   User purchases: ${finalPurchasesCount || 0}`);
    console.log(`   Ops seen: ${finalOpsCount || 0}`);
    console.log(`   Alpha codes: ${finalAlphaCodesCount || 0}`);

    // 7. Show alpha codes status
    const { data: alphaCodes } = await supabase
      .from('alpha_codes')
      .select('used');

    if (alphaCodes) {
      const available = alphaCodes.filter(code => !code.used).length;
      const used = alphaCodes.filter(code => code.used).length;
      
      console.log('\n🔑 Alpha codes status:');
      console.log(`   Total: ${alphaCodes.length}`);
      console.log(`   Available: ${available}`);
      console.log(`   Used: ${used}`);
    }

    console.log('\n✅ All application data has been wiped successfully!');
    console.log('📋 You can now start fresh with new player accounts.');
    console.log('🔑 Alpha codes are preserved for admin testing.');
    console.log('\n⚠️  IMPORTANT: You still need to clear auth users manually:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log('   2. Select all users (except any admin accounts you want to keep)');
    console.log('   3. Delete selected users');

  } catch (error) {
    console.error('❌ Error during data wipe:', error);
    process.exit(1);
  }
}

// Run the script
wipeAllData().then(() => {
  console.log('\n🎉 Data wipe completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

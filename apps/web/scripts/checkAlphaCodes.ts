import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkAlphaCodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking Alpha Codes in Database...\n');

  try {
    // Check if codes exist
    const { data: codes, error } = await supabase
      .from('alpha_codes')
      .select('code_hash, used, created_at')
      .eq('notes', 'Generated for testing - plain text code')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching codes:', error);
      process.exit(1);
    }

    if (!codes || codes.length === 0) {
      console.log('❌ No alpha codes found in database!');
      console.log('   The migration may not have run successfully.');
      console.log('\nTo fix this, run: npm run alpha:reset');
      return;
    }

    console.log(`✅ Found ${codes.length} alpha codes in database\n`);

    // Show first few codes as verification
    console.log('📋 First 10 codes (for verification):');
    console.log('=====================================\n');

    codes.slice(0, 10).forEach((code, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${code.code_hash} (${code.used ? 'Used' : 'Available'})`);
    });

    if (codes.length > 10) {
      console.log(`... and ${codes.length - 10} more codes`);
    }

    // Show usage statistics
    const usedCount = codes.filter(c => c.used).length;
    const availableCount = codes.length - usedCount;

    console.log('\n📊 Usage Statistics:');
    console.log(`   Total codes: ${codes.length}`);
    console.log(`   Available: ${availableCount}`);
    console.log(`   Used: ${usedCount}`);

    console.log('\n✅ Alpha codes are properly stored in the database!');
    console.log('   You can safely share these codes with testers.');

  } catch (error) {
    console.error('❌ Error checking alpha codes:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  checkAlphaCodes();
}

export { checkAlphaCodes };

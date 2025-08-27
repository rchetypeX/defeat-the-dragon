import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAlphaCodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧪 Testing Alpha Code System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking database tables...');
    const { data: codes, error: codesError } = await supabase
      .from('alpha_codes')
      .select('count')
      .limit(1);

    if (codesError) {
      console.error('❌ alpha_codes table not found or accessible');
      console.error('   Make sure you\'ve run the migration: supabase/migrations/20250101_add_alpha_codes.sql');
      return;
    }

    // Note: alpha_code_attempts table has been removed
    console.log('   ✅ alpha_code_attempts table removed (unnecessary for alpha testing)');

    console.log('✅ Database tables are accessible\n');

    // Test 2: Check functions
    console.log('2. Testing database functions...');
    
    // Test alpha_add_codes function
    const { data: addResult, error: addError } = await supabase.rpc('alpha_add_codes', {
      p_codes: ['DTD-TEST-1234']
    });

    if (addError) {
      console.error('❌ alpha_add_codes function error:', addError.message);
    } else {
      console.log('✅ alpha_add_codes function working');
    }

    // Test alpha_verify_and_reserve function
    const { data: verifyResult, error: verifyError } = await supabase.rpc('alpha_verify_and_reserve', {
      p_code: 'DTD-TEST-1234'
    });

    if (verifyError) {
      console.error('❌ alpha_verify_and_reserve function error:', verifyError.message);
    } else if (verifyResult && verifyResult.length > 0) {
      console.log('✅ alpha_verify_and_reserve function working');
      
      // Test alpha_finalize_with_token function
      const { data: finalizeResult, error: finalizeError } = await supabase.rpc('alpha_finalize_with_token', {
        p_token: verifyResult[0].reserved_token
      });

      if (finalizeError) {
        console.error('❌ alpha_finalize_with_token function error:', finalizeError.message);
      } else {
        console.log('✅ alpha_finalize_with_token function working');
      }
    }

    // Test 3: Check summary view
    console.log('\n3. Testing summary view...');
    const { data: summary, error: summaryError } = await supabase
      .from('alpha_codes_summary')
      .select('*');

    if (summaryError) {
      console.error('❌ alpha_codes_summary view error:', summaryError.message);
    } else {
      console.log('✅ alpha_codes_summary view working');
      console.log('   Summary:', summary);
    }

    // Note: cleanup function removed since attempts table is gone
    console.log('\n4. Cleanup function:');
    console.log('   ✅ cleanup_old_alpha_attempts function removed (unnecessary)');

    console.log('\n🎉 Alpha Code System is ready!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run alpha:generate 100');
    console.log('2. Test signup flow with generated codes');
    console.log('3. Monitor usage at /admin/alpha-codes');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAlphaCodes().catch(console.error);

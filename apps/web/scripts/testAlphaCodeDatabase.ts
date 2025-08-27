import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testAlphaCodeDatabase() {
  console.log('Testing alpha code database connection...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('alpha_codes')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Database connection test failed:', testError);
      return;
    }

    console.log('✅ Database connection successful');

    // Get all alpha codes
    const { data: allCodes, error: fetchError } = await supabase
      .from('alpha_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching alpha codes:', fetchError);
      return;
    }

    console.log(`\n📊 Found ${allCodes.length} alpha codes in database:`);
    allCodes.forEach((code, index) => {
      console.log(`${index + 1}. Code: ${code.code_hash}, Used: ${code.used}, Created: ${code.created_at}`);
    });

    // Test with a specific code format
    const testCode = 'DTD12345678'; // Example format
    console.log(`\n🔍 Testing with code: ${testCode}`);
    
    const { data: testCodeResult, error: testCodeError } = await supabase
      .from('alpha_codes')
      .select('*')
      .eq('code_hash', testCode)
      .eq('used', false)
      .single();

    console.log('Test code query result:', { testCodeResult, testCodeError });

    // Check for any unused codes
    const { data: unusedCodes, error: unusedError } = await supabase
      .from('alpha_codes')
      .select('code_hash')
      .eq('used', false)
      .limit(5);

    if (unusedError) {
      console.error('Error fetching unused codes:', unusedError);
    } else {
      console.log('\n🎯 Available (unused) codes:');
      unusedCodes.forEach((code, index) => {
        console.log(`${index + 1}. ${code.code_hash}`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAlphaCodeDatabase();

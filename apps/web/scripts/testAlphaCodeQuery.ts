import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testAlphaCodeQuery() {
  console.log('Testing alpha code query...');
  
  try {
    // Test with a code from the file
    const testCode = 'DTD-5QFY-XBGU';
    const normalizedCode = testCode.replace(/[\s-]/g, '').toUpperCase();
    
    console.log('Original code:', testCode);
    console.log('Normalized code:', normalizedCode);
    
    // Query the database
    const { data, error } = await supabase
      .from('alpha_codes')
      .select('*')
      .eq('code_hash', normalizedCode)
      .eq('used', false)
      .single();
    
    console.log('Query result:', { data, error });
    
    // Also try to get all codes to see the format
    const { data: allCodes, error: allError } = await supabase
      .from('alpha_codes')
      .select('code_hash, used')
      .limit(3);
    
    console.log('First 3 codes in database:', allCodes);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAlphaCodeQuery();

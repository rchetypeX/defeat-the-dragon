import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAlphaCodes() {
  console.log('Checking alpha codes in database...');
  
  try {
    // Get all alpha codes
    const { data: allCodes, error } = await supabase
      .from('alpha_codes')
      .select('*');
    
    if (error) {
      console.error('Error fetching alpha codes:', error);
      return;
    }
    
    console.log(`Found ${allCodes.length} alpha codes in database:`);
    
    if (allCodes.length === 0) {
      console.log('No alpha codes found! The database is empty.');
      return;
    }
    
    allCodes.forEach((code, index) => {
      console.log(`${index + 1}. Code: ${code.code_hash}, Used: ${code.used}, Created: ${code.created_at}`);
    });
    
    // Check for unused codes
    const unusedCodes = allCodes.filter(code => !code.used);
    console.log(`\nUnused codes: ${unusedCodes.length}`);
    unusedCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code.code_hash}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAlphaCodes();

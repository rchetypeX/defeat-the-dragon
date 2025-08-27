import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addProductionAlphaCodes() {
  console.log('Adding alpha codes to production database...');
  
  // Test codes from your file
  const testCodes = [
    'DTD-5QFY-XBGU',
    'DTD-BN2H-VYLY', 
    'DTD-XPXV-8A5E',
    'DTD-6P8S-WDPL',
    'DTD-QSCT-ZSLH',
    'DTD-54BN-T5ZT',
    'DTD-FP7T-D54P',
    'DTD-B9G5-UEUM',
    'DTD-ABRJ-PQYU',
    'DTD-D5QW-QX7X'
  ];
  
  try {
    for (const code of testCodes) {
      console.log(`Adding code: ${code}`);
      
      const { data, error } = await supabase
        .from('alpha_codes')
        .insert({
          code_hash: code.toUpperCase(),
          used: false
        });
      
      if (error) {
        console.error(`Error adding ${code}:`, error);
      } else {
        console.log(`✅ Added ${code}`);
      }
    }
    
    console.log('Alpha codes added successfully!');
    
    // Verify they were added
    const { data: allCodes, error: fetchError } = await supabase
      .from('alpha_codes')
      .select('code_hash, used')
      .limit(10);
    
    if (fetchError) {
      console.error('Error fetching codes:', fetchError);
    } else {
      console.log('\nCodes in database:');
      allCodes.forEach((code, index) => {
        console.log(`${index + 1}. ${code.code_hash} (${code.used ? 'Used' : 'Available'})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addProductionAlphaCodes();

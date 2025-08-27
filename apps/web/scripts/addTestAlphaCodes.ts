import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTestAlphaCodes() {
  console.log('Adding test alpha codes to database...');
  
  const testCodes = [
    'DTD-5QFY-XBGU',
    'DTD-BN2H-VYLY',
    'DTD-XPXV-8A5E',
    'DTD-6P8S-WDPL',
    'DTD-QSCT-ZSLH'
  ];
  
  try {
    for (const code of testCodes) {
      const normalizedCode = code.replace(/[\s-]/g, '').toUpperCase();
      
      console.log(`Adding code: ${code} (normalized: ${normalizedCode})`);
      
      const { data, error } = await supabase
        .from('alpha_codes')
        .insert({
          code_hash: normalizedCode,
          used: false
        });
      
      if (error) {
        console.error(`Error adding ${code}:`, error);
      } else {
        console.log(`✅ Added ${code}`);
      }
    }
    
    console.log('Test codes added successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestAlphaCodes();

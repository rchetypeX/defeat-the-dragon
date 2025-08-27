import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupAlphaCodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Setting up Alpha Codes...\n');

  try {
    // Step 1: Clear existing codes
    console.log('1. Clearing existing alpha codes...');
    
    const { error: deleteError } = await supabase
      .from('alpha_codes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.warn('⚠️  Warning clearing codes:', deleteError.message);
    }

    console.log('✅ Existing codes cleared\n');

    // Step 2: Generate new codes
    console.log('2. Generating 10 test alpha codes...');
    
    const codes = [
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

    console.log('✅ Codes generated\n');

    // Step 3: Insert codes into database
    console.log('3. Inserting codes into database...');
    
    const codeRecords = codes.map(code => ({
      code_hash: code, // Store as plain text
      used: false,
      notes: `Test code - ${new Date().toISOString()}`
    }));

    const { error: insertError } = await supabase
      .from('alpha_codes')
      .insert(codeRecords);

    if (insertError) {
      console.error('❌ Error inserting codes:', insertError);
      return;
    }

    console.log('✅ Codes inserted successfully!\n');

    // Step 4: Verify the codes
    console.log('4. Verifying codes in database...');
    
    const { data: allCodes, error: fetchError } = await supabase
      .from('alpha_codes')
      .select('code_hash, used')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching codes:', fetchError);
      return;
    }

    console.log('✅ Codes in database:');
    allCodes.forEach((code, index) => {
      console.log(`   ${index + 1}. ${code.code_hash} (${code.used ? 'Used' : 'Available'})`);
    });

    console.log('\n🎉 Alpha code setup complete!');
    console.log('📝 You can now test with any of these codes:');
    codes.forEach(code => console.log(`   ${code}`));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupAlphaCodes();

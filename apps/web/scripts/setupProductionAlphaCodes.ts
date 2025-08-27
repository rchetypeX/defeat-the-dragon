import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupProductionAlphaCodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  console.log('🌐 Production Database URL:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Setting up Alpha Codes for PRODUCTION...\n');

  try {
    // Clear existing codes
    console.log('1. Clearing existing alpha codes...');
    const { error: deleteError } = await supabase
      .from('alpha_codes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.warn('⚠️  Warning:', deleteError.message);
    }
    console.log('✅ Existing codes cleared\n');

    // Generate new codes
    const codes = [
      'DTD-5QFY-XBGU', 'DTD-BN2H-VYLY', 'DTD-XPXV-8A5E',
      'DTD-6P8S-WDPL', 'DTD-QSCT-ZSLH', 'DTD-54BN-T5ZT',
      'DTD-FP7T-D54P', 'DTD-B9G5-UEUM', 'DTD-ABRJ-PQYU',
      'DTD-D5QW-QX7X'
    ];

    console.log('2. Inserting codes into PRODUCTION database...');
    const codeRecords = codes.map(code => ({
      code_hash: code,
      used: false,
      notes: `Production test code - ${new Date().toISOString()}`
    }));

    const { error: insertError } = await supabase
      .from('alpha_codes')
      .insert(codeRecords);

    if (insertError) {
      console.error('❌ Error:', insertError);
      return;
    }

    console.log('✅ Codes inserted into PRODUCTION!\n');

    // Verify
    const { data: allCodes } = await supabase
      .from('alpha_codes')
      .select('code_hash, used')
      .order('created_at', { ascending: true });

    console.log('✅ Codes in PRODUCTION:');
    allCodes.forEach((code, index) => {
      console.log(`   ${index + 1}. ${code.code_hash} (${code.used ? 'Used' : 'Available'})`);
    });

    console.log('\n🎉 PRODUCTION setup complete!');
    console.log('🌐 Test on: https://dtd.rchetype.xyz');
    codes.forEach(code => console.log(`   ${code}`));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupProductionAlphaCodes();

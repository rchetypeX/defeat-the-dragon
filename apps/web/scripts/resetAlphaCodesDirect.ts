import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function resetAlphaCodesDirect() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Resetting Alpha Codes for Testing...\n');

  try {
    // Step 1: Clear existing data
    console.log('1. Clearing existing alpha codes...');
    
    const { error: deleteCodesError } = await supabase
      .from('alpha_codes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteCodesError) {
      console.warn('⚠️  Warning clearing codes:', deleteCodesError.message);
    }

    console.log('✅ Existing data cleared\n');

    // Step 2: Generate new codes
    console.log('2. Generating 52 new alpha codes...');
    
    const codes: string[] = [];
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O, 1/I
    
    for (let i = 0; i < 52; i++) {
      const generateCode = () => {
        const rand = (n: number) => 
          Array.from({ length: n }, () => 
            alphabet[Math.floor(Math.random() * alphabet.length)]
          ).join('');
        
        return `DTD-${rand(4)}-${rand(4)}`;
      };
      
      let code: string;
      do {
        code = generateCode();
      } while (codes.includes(code)); // Ensure uniqueness
      
      codes.push(code);
    }

    console.log('✅ Codes generated\n');

    // Step 3: Insert codes into database
    console.log('3. Inserting codes into database...');
    
    const codeRecords = codes.map(code => ({
      code_hash: code, // Store plain text for easy access
      used: false,
      notes: 'Generated for testing - plain text code'
    }));

    const { error: insertError } = await supabase
      .from('alpha_codes')
      .insert(codeRecords);

    if (insertError) {
      console.error('❌ Error inserting codes:', insertError);
      process.exit(1);
    }

    console.log('✅ Codes inserted into database\n');

    // Step 4: Display the codes
    console.log('📋 Generated Alpha Codes for Testing:');
    console.log('=====================================\n');

    codes.forEach((code, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${code}`);
    });

    // Step 5: Save codes to files for easy sharing
    const outputPath = path.join(__dirname, '../alpha_codes_for_testing.txt');
    const codeList = codes.map((code, index) => 
      `${(index + 1).toString().padStart(2, '0')}. ${code}`
    ).join('\n');

    const fileContent = `Alpha Codes for Testing
Generated on: ${new Date().toISOString()}
Total codes: ${codes.length}

${codeList}

Instructions for testers:
1. Go to the app signup page
2. Enter one of the codes above
3. Complete the signup process
4. Each code can only be used once

Note: These codes are for testing purposes only and will be reset before production.
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`\n💾 Codes saved to: ${outputPath}`);

    // Step 6: Create a simple list for easy copying
    const simpleListPath = path.join(__dirname, '../alpha_codes_simple.txt');
    const simpleList = codes.join('\n');
    fs.writeFileSync(simpleListPath, simpleList);
    console.log(`📝 Simple list saved to: ${simpleListPath}`);

    // Step 7: Create a CSV file for spreadsheet import
    const csvPath = path.join(__dirname, '../alpha_codes.csv');
    const csvContent = `Code Number,Alpha Code,Status\n${codes.map((code, index) => 
      `${index + 1},${code},Available`
    ).join('\n')}`;
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📊 CSV file saved to: ${csvPath}`);

    console.log('\n🎉 Alpha code reset completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Share the codes with your testers');
    console.log('2. Test the signup flow with the new codes');
    console.log('3. Monitor usage in the admin panel');
    console.log('4. Remember to implement proper hashing before production');

  } catch (error) {
    console.error('❌ Error resetting alpha codes:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  resetAlphaCodesDirect();
}

export { resetAlphaCodesDirect };

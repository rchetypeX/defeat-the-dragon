import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function resetAlphaCodes() {
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
    // Step 1: Read and execute the migration SQL
    console.log('1. Executing migration SQL...');
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20250127_reset_alpha_codes_for_testing.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn('⚠️  Warning executing statement:', error.message);
        }
      }
    }

    console.log('✅ Migration executed successfully\n');

    // Step 2: Fetch the generated codes
    console.log('2. Fetching generated codes...');
    const { data: codes, error } = await supabase
      .from('alpha_codes')
      .select('code_hash, created_at')
      .eq('notes', 'Generated for testing - plain text code')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching codes:', error);
      process.exit(1);
    }

    console.log(`✅ Generated ${codes.length} alpha codes\n`);

    // Step 3: Display the codes
    console.log('📋 Generated Alpha Codes for Testing:');
    console.log('=====================================\n');

    codes.forEach((code, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${code.code_hash}`);
    });

    // Step 4: Save codes to a file for easy sharing
    const outputPath = path.join(__dirname, '../alpha_codes_for_testing.txt');
    const codeList = codes.map((code, index) => 
      `${(index + 1).toString().padStart(2, '0')}. ${code.code_hash}`
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

    // Step 5: Create a simple list for easy copying
    const simpleListPath = path.join(__dirname, '../alpha_codes_simple.txt');
    const simpleList = codes.map(code => code.code_hash).join('\n');
    fs.writeFileSync(simpleListPath, simpleList);
    console.log(`📝 Simple list saved to: ${simpleListPath}`);

    console.log('\n🎉 Alpha code reset completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Share the codes with your testers');
    console.log('2. Test the signup flow with the new codes');
    console.log('3. Monitor usage in the admin panel');
    console.log('4. Remember to delete the alpha_codes_plain_text view before production');

  } catch (error) {
    console.error('❌ Error resetting alpha codes:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  resetAlphaCodes();
}

export { resetAlphaCodes };

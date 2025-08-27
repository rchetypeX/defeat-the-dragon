import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function exportAlphaCodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📤 Exporting Alpha Codes...\n');

  try {
    // Fetch codes from database
    const { data: codes, error } = await supabase
      .from('alpha_codes')
      .select('code_hash, used, created_at')
      .eq('notes', 'Generated for testing - plain text code')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching codes:', error);
      process.exit(1);
    }

    if (!codes || codes.length === 0) {
      console.log('❌ No alpha codes found in database!');
      console.log('   Run: npm run alpha:reset');
      return;
    }

    // Create output directory in user's home directory (outside repo)
    const outputDir = path.join(os.homedir(), 'alpha_codes_export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create formatted file
    const formattedPath = path.join(outputDir, `alpha_codes_${timestamp}.txt`);
    const codeList = codes.map((code, index) => 
      `${(index + 1).toString().padStart(2, '0')}. ${code.code_hash}`
    ).join('\n');

    const formattedContent = `Alpha Codes for Testing
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

    fs.writeFileSync(formattedPath, formattedContent);

    // Create simple list
    const simplePath = path.join(outputDir, `alpha_codes_simple_${timestamp}.txt`);
    const simpleContent = codes.map(code => code.code_hash).join('\n');
    fs.writeFileSync(simplePath, simpleContent);

    // Create CSV
    const csvPath = path.join(outputDir, `alpha_codes_${timestamp}.csv`);
    const csvContent = `Code Number,Alpha Code,Status\n${codes.map((code, index) => 
      `${index + 1},${code.code_hash},${code.used ? 'Used' : 'Available'}`
    ).join('\n')}`;
    fs.writeFileSync(csvPath, csvContent);

    console.log(`✅ Exported ${codes.length} alpha codes to:`);
    console.log(`   📁 Directory: ${outputDir}`);
    console.log(`   📄 Formatted: ${path.basename(formattedPath)}`);
    console.log(`   📝 Simple: ${path.basename(simplePath)}`);
    console.log(`   📊 CSV: ${path.basename(csvPath)}`);

    console.log('\n📋 First 10 codes (for verification):');
    console.log('=====================================\n');

    codes.slice(0, 10).forEach((code, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${code.code_hash}`);
    });

    if (codes.length > 10) {
      console.log(`... and ${codes.length - 10} more codes`);
    }

    console.log('\n🔒 Security: Files are saved outside your repository');
    console.log('   They will NOT be committed to Git');

  } catch (error) {
    console.error('❌ Error exporting alpha codes:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  exportAlphaCodes();
}

export { exportAlphaCodes };

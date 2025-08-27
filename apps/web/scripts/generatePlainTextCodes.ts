import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Helper function to hash alpha codes (matches database function)
function hashAlphaCode(code: string): string {
  // Normalize the code (same as database function)
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Hash using SHA-256
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Generate alpha codes and export them in plain text
async function generatePlainTextCodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔐 Generate and Export Alpha Codes in Plain Text\n');

  try {
    // Get command line arguments
    const count = parseInt(process.argv[2]) || 52;

    console.log(`🔄 Generating ${count} Alpha Codes...\n`);

    // Generate codes
    const codes: string[] = [];
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O, 1/I
    
    for (let i = 0; i < count; i++) {
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

    // Insert codes into database as plain text (as requested)
    const codeRecords = codes.map(code => ({
      code_hash: code, // Store as plain text
      used: false,
      notes: `Generated for testing - plain text - ${new Date().toISOString()}`
    }));

    const { error: insertError } = await supabase
      .from('alpha_codes')
      .insert(codeRecords);

    if (insertError) {
      console.error('❌ Error inserting codes:', insertError);
      return;
    }

    console.log(`✅ Generated ${count} alpha codes successfully!\n`);

    // Create output directory in user's home directory (outside repo)
    const outputDir = path.join(os.homedir(), 'alpha_codes_export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create formatted file with plain text codes
    const formattedPath = path.join(outputDir, `alpha_codes_plain_text_${timestamp}.txt`);
    const codeList = codes.map((code, index) => 
      `${(index + 1).toString().padStart(2, '0')}. ${code}`
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
    const simpleContent = codes.join('\n');
    fs.writeFileSync(simplePath, simpleContent);

    // Create CSV
    const csvPath = path.join(outputDir, `alpha_codes_${timestamp}.csv`);
    const csvContent = `Code Number,Alpha Code,Status\n${codes.map((code, index) => 
      `${index + 1},${code},Available`
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
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${code}`);
    });

    if (codes.length > 10) {
      console.log(`... and ${codes.length - 10} more codes`);
    }

    console.log('\n🔒 Security: Files are saved outside your repository');
    console.log('   They will NOT be committed to Git');
    console.log('\n💡 Tip: Use "npm run admin:alpha list" to check usage status');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  generatePlainTextCodes();
}

export { generatePlainTextCodes };

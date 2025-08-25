import { generateAndAddCodes } from '../lib/alphaCodeGenerator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nMake sure these are set in your .env.local file');
    process.exit(1);
  }

  // Get number of codes from command line argument or default to 10
  const codeCount = parseInt(process.argv[2]) || 10;

  console.log(`🚀 Generating ${codeCount} alpha codes...`);

  try {
    const result = await generateAndAddCodes(
      codeCount,
      supabaseUrl,
      supabaseServiceKey
    );

    console.log('\n✅ Alpha codes generated and added successfully!');
    console.log(`📊 Results:`);
    console.log(`   - Codes generated: ${result.codes.length}`);
    console.log(`   - Successfully added: ${result.success}`);
    
    if (result.errors.length > 0) {
      console.log(`   - Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`     - ${error}`));
    }

    console.log('\n📝 Generated codes:');
    result.codes.forEach((code, index) => {
      console.log(`   ${index + 1}. ${code}`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Share these codes with your alpha testers');
    console.log('   2. Monitor usage in the admin panel: /admin/alpha-codes');
    console.log('   3. Test the signup flow with one of these codes');

  } catch (error) {
    console.error('❌ Error generating alpha codes:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

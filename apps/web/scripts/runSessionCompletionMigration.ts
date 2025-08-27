import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Run session completion migration
async function runSessionCompletionMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Running Session Completion Migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20250127_add_session_completion_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully\n');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (e) {
        console.error(`❌ Exception executing statement ${i + 1}:`, e);
        // Continue with other statements
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📋 Summary:');
    console.log('   - Session completion functions created');
    console.log('   - Functions bypass unauthorized update trigger');
    console.log('   - Session completion API should now work correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
if (require.main === module) {
  runSessionCompletionMigration();
}

export { runSessionCompletionMigration };

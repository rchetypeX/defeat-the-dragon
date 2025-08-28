#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('Service Key:', supabaseServiceKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔗 Testing connection...');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Players count:', data || 0);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testConnection();

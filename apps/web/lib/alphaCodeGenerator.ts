import { createClient } from '@supabase/supabase-js';

// Human-friendly pattern: DTD-XXXX-XXXX (A–Z, 2–9; avoid 0/O, 1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const rand = (n: number) => 
    Array.from({ length: n }, () => 
      ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join('');
  
  return `DTD-${rand(4)}-${rand(4)}`;
}

export function generateAlphaCodes(count: number): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    codes.push(generateCode());
  }
  
  return codes;
}

export async function addAlphaCodesToDatabase(
  codes: string[], 
  supabaseUrl: string, 
  supabaseServiceKey: string,
  expiresAt?: Date,
  notes?: string
): Promise<{ success: number; errors: string[] }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const errors: string[] = [];
  let successCount = 0;
  
  try {
    // Use the RPC function to add codes
    const { data, error } = await supabase.rpc('alpha_add_codes', {
      p_codes: codes
    });
    
    if (error) {
      throw error;
    }
    
    successCount = data || 0;
    
    // If we have expiration or notes, update the newly added codes
    if (expiresAt || notes) {
      // Note: This is a simplified approach. In production, you might want to
      // modify the alpha_add_codes function to accept these parameters
      console.log(`Added ${successCount} codes to database`);
    }
    
  } catch (error) {
    console.error('Error adding alpha codes to database:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  return { success: successCount, errors };
}

// Utility function to generate and add codes in one step
export async function generateAndAddCodes(
  count: number,
  supabaseUrl: string,
  supabaseServiceKey: string,
  expiresAt?: Date,
  notes?: string
): Promise<{ codes: string[]; success: number; errors: string[] }> {
  const codes = generateAlphaCodes(count);
  const result = await addAlphaCodesToDatabase(codes, supabaseUrl, supabaseServiceKey, expiresAt, notes);
  
  return {
    codes,
    success: result.success,
    errors: result.errors
  };
}

// CLI utility for generating codes
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 10;
  const codes = generateAlphaCodes(count);
  
  console.log(`Generated ${count} alpha codes:`);
  codes.forEach((code, index) => {
    console.log(`${index + 1}. ${code}`);
  });
  
  console.log('\nTo add these to the database, use:');
  console.log('generateAndAddCodes(codes, supabaseUrl, supabaseServiceKey)');
}

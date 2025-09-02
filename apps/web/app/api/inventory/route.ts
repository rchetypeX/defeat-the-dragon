import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

// Create a single service role client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user session from Supabase
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    let userId: string | null = null;
    
    // First, check for Bearer token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer '
      
      // Check if it's a wallet token
      if (token.startsWith('wallet:')) {
        try {
          const walletData = JSON.parse(token.substring(7)); // Remove 'wallet:'
          userId = walletData.id;
          console.log('Inventory: Found wallet user from Bearer token:', userId);
        } catch (e) {
          console.error('Error parsing wallet user from Bearer token:', e);
        }
      } else {
        // It's a Supabase token, verify it
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            userId = user.id;
            console.log('Inventory: Found Supabase user from Bearer token:', userId);
          } else {
            console.error('Invalid Supabase token:', error);
          }
        } catch (e) {
          console.error('Error verifying Supabase token:', e);
        }
      }
    }
    
    // If no user found from Bearer token, try session
    if (!userId) {
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      
      if (user) {
        // Standard Supabase auth user
        userId = user.id;
        console.log('Inventory: Found Supabase user from session:', userId);
      } else {
        // Check if this is a wallet user by looking for wallet address in headers or cookies
        const walletUser = cookieStore.get('wallet-user');
        if (walletUser) {
          try {
            const walletData = JSON.parse(walletUser.value);
            userId = walletData.id;
            console.log('Inventory: Found wallet user from cookie:', userId);
          } catch (e) {
            console.error('Error parsing wallet user data:', e);
          }
        }
        
        // Also check for wallet user in request headers (for API calls)
        if (!userId && authHeader) {
          if (authHeader.startsWith('wallet:')) {
            try {
              const walletData = JSON.parse(authHeader.substring(7)); // Remove 'wallet:'
              userId = walletData.id;
              console.log('Inventory: Found wallet user from header:', userId);
            } catch (e) {
              console.error('Error parsing wallet user from header:', e);
            }
          } else if (authHeader.startsWith('Bearer wallet:')) {
            try {
              const walletData = JSON.parse(authHeader.substring(15)); // Remove 'Bearer wallet:'
              userId = walletData.id;
              console.log('Inventory: Found wallet user from Bearer wallet header:', userId);
            } catch (e) {
              console.error('Error parsing wallet user from Bearer wallet header:', e);
            }
                  } else if (authHeader.startsWith('Bearer baseapp:')) {
          try {
            const baseAppData = JSON.parse(authHeader.substring(14)); // Remove 'Bearer baseapp:'
            // Convert Base App numeric ID to a consistent UUID format
            userId = `baseapp-${baseAppData.id}`;
            console.log('Inventory: Found Base App user from header:', userId);
          } catch (e) {
            console.error('Error parsing Base App user from header:', e);
          }
        } else if (authHeader.startsWith('baseapp:')) {
          try {
            const baseAppData = JSON.parse(authHeader.substring(8)); // Remove 'baseapp:'
            // Convert Base App numeric ID to a consistent UUID format
            userId = `baseapp-${baseAppData.id}`;
            console.log('Inventory: Found Base App user from header:', userId);
          } catch (e) {
            console.error('Error parsing Base App user from header:', e);
          }
        } else if (authHeader.startsWith('Bearer siwf:') || authHeader.startsWith('siwf:')) {
          try {
            const siwfData = JSON.parse(authHeader.substring(authHeader.startsWith('Bearer ') ? 11 : 5));
            // Look up SIWF user by Farcaster FID
            const { data: siwfUser, error: siwfError } = await supabase
              .from('players')
              .select('id')
              .eq('farcaster_fid', siwfData.fid)
              .single();
            
            if (siwfUser && !siwfError) {
              userId = siwfUser.id;
              console.log('Inventory: Found SIWF user from header:', userId, 'FID:', siwfData.fid);
            } else {
              console.error('SIWF user not found in database:', siwfError);
            }
          } catch (e) {
            console.error('Error parsing SIWF user from header:', e);
          }
        }
        }
      }
    }
    
    if (!userId) {
      console.error('Inventory: No user ID found. Auth header:', request.headers.get('authorization'));
      console.error('Inventory: Cookie wallet user:', cookieStore.get('wallet-user'));
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's inventory from database
    const { data: inventory, error: inventoryError } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    // If no inventory found, create default inventory for new users
    if (!inventory || inventory.length === 0) {
      const defaultInventory = [
        {
          user_id: userId,
          item_id: 'fighter',
          item_type: 'character',
          quantity: 1,
          equipped: true,
          acquired_at: new Date().toISOString()
        },
        {
          user_id: userId,
          item_id: 'forest',
          item_type: 'background',
          quantity: 1,
          equipped: true,
          acquired_at: new Date().toISOString()
        }
      ];

      // Insert default inventory into database
      const { data: createdInventory, error: createError } = await supabase
        .from('user_inventory')
        .insert(defaultInventory)
        .select();

      if (createError) {
        console.error('Error creating default inventory:', createError);
        return NextResponse.json({
          success: true,
          data: defaultInventory, // Return default data even if DB insert fails
        });
      }

      return NextResponse.json({
        success: true,
        data: createdInventory,
      });
    }

    const response = NextResponse.json({
      success: true,
      data: inventory,
    });

    // Ensure no caching for inventory to get fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

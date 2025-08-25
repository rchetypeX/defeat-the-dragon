import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    
    // Use service role client for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Try to get user from session first
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    let userId: string | null = null;
    
    if (user) {
      // Standard Supabase auth user
      userId = user.id;
    } else {
      // Check if this is a wallet user by looking for wallet address in headers or cookies
      const walletUser = cookieStore.get('wallet-user');
      if (walletUser) {
        try {
          const walletData = JSON.parse(walletUser.value);
          userId = walletData.id;
        } catch (e) {
          console.error('Error parsing wallet user data:', e);
        }
      }
      
      // Also check for wallet user in request headers (for API calls)
      if (!userId) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer wallet:')) {
          try {
            const walletData = JSON.parse(authHeader.substring(15)); // Remove 'Bearer wallet:'
            userId = walletData.id;
          } catch (e) {
            console.error('Error parsing wallet user from header:', e);
          }
        }
      }
    }
    
    if (!userId) {
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

    // Add caching headers to reduce Edge Requests
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
    response.headers.set('ETag', `"inventory-${userId}-${Date.now()}"`);

    return response;

  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

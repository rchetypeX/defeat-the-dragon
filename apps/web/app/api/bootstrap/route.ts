import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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
      console.log('Bootstrap: Found Supabase user from session:', userId);
    } else {
      // Check for wallet or Base App user in headers
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          
          if (token.startsWith('wallet:')) {
            try {
              const walletData = JSON.parse(token.substring(7));
              userId = walletData.id;
              console.log('Bootstrap: Found wallet user from Bearer token:', userId);
            } catch (e) {
              console.error('Error parsing wallet user from Bearer token:', e);
            }
          } else if (token.startsWith('baseapp:')) {
            try {
              const baseAppData = JSON.parse(token.substring(8));
              userId = baseAppData.id;
              console.log('Bootstrap: Found Base App user from Bearer token:', userId);
            } catch (e) {
              console.error('Error parsing Base App user from Bearer token:', e);
            }
          } else {
            // It's a Supabase token, verify it
            try {
              const { data: { user }, error } = await supabase.auth.getUser(token);
              if (user && !error) {
                userId = user.id;
                console.log('Bootstrap: Found Supabase user from Bearer token:', userId);
              } else {
                console.error('Invalid Supabase token:', error);
              }
            } catch (e) {
              console.error('Error verifying Supabase token:', e);
            }
          }
        } else if (authHeader.startsWith('wallet:')) {
          try {
            const walletData = JSON.parse(authHeader.substring(7));
            userId = walletData.id;
            console.log('Bootstrap: Found wallet user from header:', userId);
          } catch (e) {
            console.error('Error parsing wallet user from header:', e);
          }
        } else if (authHeader.startsWith('baseapp:')) {
          try {
            const baseAppData = JSON.parse(authHeader.substring(8));
            userId = baseAppData.id;
            console.log('Bootstrap: Found Base App user from header:', userId);
          } catch (e) {
            console.error('Error parsing Base App user from header:', e);
          }
        }
      }
    }
    
    if (!userId) {
      console.log('Bootstrap: No user found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get player data
    let { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (playerError && playerError.code === 'PGRST116') {
      // Create default player if not found
      const defaultPlayer = {
        user_id: userId,
        level: 1,
        xp: 0,
        coins: 100,
        sparks: 50,
        created_at: new Date().toISOString()
      };
      
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert(defaultPlayer)
        .select()
        .single();
      
      if (createError) {
        console.error('Bootstrap: Failed to create default player:', createError);
        return NextResponse.json(
          { error: 'Failed to create player' },
          { status: 500 }
        );
      }
      
      console.log('Bootstrap: Created default player');
      player = newPlayer;
    } else if (playerError) {
      console.error('Bootstrap: Error fetching player:', playerError);
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      );
    }

    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get inventory (only IDs and equipped status)
    const { data: inventory, error: inventoryError } = await supabase
      .from('user_inventory')
      .select('item_id, item_type, equipped')
      .eq('user_id', userId);

    if (inventoryError) {
      console.error('Bootstrap: Error fetching inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Prepare response
    const response = {
      profile: profile || { id: userId, display_name: player?.display_name || 'Adventurer' },
      player: {
        level: player?.level || 1,
        xp: player?.xp || 0,
        coins: player?.coins || 100,
        sparks: player?.sparks || 50,
        display_name: player?.display_name || 'Adventurer'
      },
      equipped: {
        character_sku: settings?.equipped_character || 'fighter',
        background_sku: settings?.equipped_background || 'forest'
      },
      inventory_ids: inventory?.map(item => ({
        id: item.item_id,
        type: item.item_type,
        equipped: item.equipped
      })) || [],
      assets_version: 1, // Static for now
      lastServerUpdatedAt: new Date().toISOString()
    };

    console.log('Bootstrap: Successfully loaded data for user:', userId);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

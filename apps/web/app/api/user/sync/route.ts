import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    
    // Use the existing service role client for database operations
    // (supabase is already defined at the top of the file)
    
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
          console.log('User sync: Found wallet user from Bearer token:', userId);
        } catch (e) {
          console.error('Error parsing wallet user from Bearer token:', e);
        }
      } else {
        // It's a Supabase token, verify it
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            userId = user.id;
            console.log('User sync: Found Supabase user from Bearer token:', userId);
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
        console.log('User sync: Found Supabase user from session:', userId);
      } else {
        // Check if this is a wallet user by looking for wallet address in headers or cookies
        const walletUser = cookieStore.get('wallet-user');
        if (walletUser) {
          try {
            const walletData = JSON.parse(walletUser.value);
            userId = walletData.id;
            console.log('User sync: Found wallet user from cookie:', userId);
          } catch (e) {
            console.error('Error parsing wallet user data:', e);
          }
        }
        
        // Also check for wallet user in request headers (for API calls)
        if (!userId && authHeader && authHeader.startsWith('wallet:')) {
          try {
            const walletData = JSON.parse(authHeader.substring(7)); // Remove 'wallet:'
            userId = walletData.id;
            console.log('User sync: Found wallet user from header:', userId);
          } catch (e) {
            console.error('Error parsing wallet user from header:', e);
          }
        }
      }
    }
    
    if (!userId) {
      console.error('User sync: No user ID found. Auth header:', request.headers.get('authorization'));
      console.error('User sync: Cookie wallet user:', cookieStore.get('wallet-user'));
      console.error('User sync: Session user:', await supabaseAuth.auth.getUser());
      
      // For newly created users, give them a bit more time for the session to establish
      // This is a common issue with Supabase where there's a delay between user creation and session availability
      return NextResponse.json(
        { error: 'Unauthorized - Please wait a moment and try again, or refresh the page' },
        { status: 401 }
      );
    }

    // Fetch user data from players table
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Also get auth user data to check for display_name in metadata
    let authUser = null;
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      authUser = user;
    } catch (e) {
      console.log('Could not fetch auth user data:', e);
    }

    // Check for critical errors
    if (playerError && playerError.code !== 'PGRST116') {
      console.error('Error fetching player data:', playerError);
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      );
    }

    // If player doesn't exist, create a default one
    let playerData = player;
    if (playerError && playerError.code === 'PGRST116') {
      console.log('Player not found, creating default player...');
      
      // Check if this is a wallet user
      const authHeader = request.headers.get('authorization');
      const isWalletUser = authHeader && authHeader.startsWith('Bearer wallet:');
      
      let defaultPlayer: any = {
        user_id: userId,
        level: 1,
        xp: 0,
        coins: 100,
        sparks: 50,
        created_at: new Date().toISOString()
      };
      
      // If it's a wallet user, add wallet address
      if (isWalletUser) {
        try {
          const walletData = JSON.parse(authHeader.substring(15));
          defaultPlayer.wallet_address = walletData.address;
          defaultPlayer.display_name = walletData.display_name || 'Adventurer';
        } catch (e) {
          console.error('Error parsing wallet data:', e);
        }
      }
      
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert(defaultPlayer)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating default player:', createError);
        return NextResponse.json(
          { error: 'Failed to create default player' },
          { status: 500 }
        );
      }
      
             playerData = newPlayer;
    }

         // Ensure display_name is up to date by checking both sources
         let finalPlayerData = playerData;
         if (playerData && authUser) {
           // Prioritize players table display_name, but fall back to auth metadata if needed
           const authDisplayName = authUser.user_metadata?.display_name;
           if (!playerData.display_name && authDisplayName) {
             finalPlayerData = { ...playerData, display_name: authDisplayName };
           }
         }

         // Return user data with available information
     return NextResponse.json({
       success: true,
       data: {
         player: finalPlayerData || null,
        // Return default inventory for new users
        settings: null,
        inventory: [
          {
            id: 'default-fighter',
            user_id: userId,
            item_id: 'fighter',
            item_type: 'character',
            quantity: 1,
            equipped: true,
            acquired_at: new Date().toISOString()
          },
          {
            id: 'default-forest',
            user_id: userId,
            item_id: 'forest',
            item_type: 'background',
            quantity: 1,
            equipped: true,
            acquired_at: new Date().toISOString()
          }
        ],
        subscriptions: [],
        purchases: [],
        achievements: []
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Use the existing service role client for database operations
    // (supabase is already defined at the top of the file)
    
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
          console.log('User sync: Found wallet user from Bearer token:', userId);
        } catch (e) {
          console.error('Error parsing wallet user from Bearer token:', e);
        }
      } else {
        // It's a Supabase token, verify it
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            userId = user.id;
            console.log('User sync: Found Supabase user from Bearer token:', userId);
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
        console.log('User sync: Found Supabase user from session:', userId);
      } else {
        // Check if this is a wallet user by looking for wallet address in headers or cookies
        const walletUser = cookieStore.get('wallet-user');
        if (walletUser) {
          try {
            const walletData = JSON.parse(walletUser.value);
            userId = walletData.id;
            console.log('User sync: Found wallet user from cookie:', userId);
          } catch (e) {
            console.error('Error parsing wallet user data:', e);
          }
        }
        
        // Also check for wallet user in request headers (for API calls)
        if (!userId && authHeader && authHeader.startsWith('wallet:')) {
          try {
            const walletData = JSON.parse(authHeader.substring(7)); // Remove 'wallet:'
            userId = walletData.id;
            console.log('User sync: Found wallet user from header:', userId);
          } catch (e) {
            console.error('Error parsing wallet user from header:', e);
          }
        }
      }
    }
    
    if (!userId) {
      console.error('User sync: No user ID found. Auth header:', request.headers.get('authorization'));
      console.error('User sync: Cookie wallet user:', cookieStore.get('wallet-user'));
      console.error('User sync: Session user:', await supabaseAuth.auth.getUser());
      
      // For newly created users, give them a bit more time for the session to establish
      // This is a common issue with Supabase where there's a delay between user creation and session availability
      return NextResponse.json(
        { error: 'Unauthorized - Please wait a moment and try again, or refresh the page' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { 
      player, 
      settings, 
      inventory, 
      subscriptions, 
      purchases, 
      achievements 
    } = body;

    // Debug logging for display name updates
    console.log('POST /user/sync - Request body:', { 
      player: player ? { 
        display_name: player.display_name, 
        level: player.level, 
        xp: player.xp,
        coins: player.coins,
        sparks: player.sparks
      } : null,
      hasSettings: !!settings,
      hasInventory: !!inventory
    });

    const results: any = {};

    // Update player data if provided
    if (player) {
      // Update both players and profiles tables to keep them in sync
      const updatePromises = [];
      
      console.log('POST /user/sync - Updating player with display_name:', player.display_name);
      
      // Only include fields that actually exist in the database schema
      // This prevents errors with removed fields like current_streak, bond_score, etc.
      const playerUpdateData: any = {};
      
      // Only include fields that exist in the current schema
      if (player.display_name !== undefined) playerUpdateData.display_name = player.display_name;
      if (player.level !== undefined) playerUpdateData.level = player.level;
      if (player.xp !== undefined) playerUpdateData.xp = player.xp;
      if (player.coins !== undefined) playerUpdateData.coins = player.coins;
      if (player.sparks !== undefined) playerUpdateData.sparks = player.sparks;
      if (player.is_inspired !== undefined) playerUpdateData.is_inspired = player.is_inspired;
      
      // Update needsAdventurerName based on display_name
      if (player.display_name !== undefined) {
        const isRealName = player.display_name && 
                          player.display_name !== 'Adventurer' && 
                          !player.display_name.startsWith('Player_') &&
                          player.display_name.length >= 2;
        playerUpdateData.needsAdventurerName = !isRealName;
      }
      
      console.log('POST /user/sync - Filtered player update data:', playerUpdateData);
      
      // Update players table with only valid fields
      console.log('POST /user/sync - Updating players table with:', playerUpdateData);
      updatePromises.push(
        supabase
          .from('players')
          .update(playerUpdateData)
          .eq('user_id', userId)
          .select()
          .single()
      );
      
      // Update Supabase Auth Users table with display_name if provided
      if (player.display_name) {
        updatePromises.push(
          supabase.auth.admin.updateUserById(userId, {
            user_metadata: { display_name: player.display_name }
          })
        );
      }
      
      // Wait for all updates to complete
      console.log('POST /user/sync - Executing updates...');
      let playerResult, authResult;
      try {
        [playerResult, authResult] = await Promise.all(updatePromises);
      } catch (error) {
        console.error('POST /user/sync - Error during updates:', error);
        throw error;
      }
      
      if (playerResult.error) {
        console.error('Error updating player:', playerResult.error);
        results.player = { error: playerResult.error.message };
      } else {
        console.log('POST /user/sync - Player update successful:', playerResult.data);
        console.log('POST /user/sync - Updated display_name:', playerResult.data?.display_name);
        results.player = { success: true, data: playerResult.data };
      }
      
      // Log auth update result (but don't fail the whole operation if it fails)
      if (authResult && authResult.error) {
        console.error('Error updating auth user:', authResult.error);
      } else if (authResult) {
        console.log('Auth user updated successfully');
      }
    }

    // Update settings if provided
    if (settings) {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          sound_enabled: settings.sound_enabled,
          notifications_enabled: settings.notifications_enabled,
          accessibility: settings.accessibility,
          equipped_character: settings.equipped_character,
          equipped_background: settings.equipped_background
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        results.settings = { error: error.message };
      } else {
        results.settings = { success: true, data };
      }
    }

    // Update inventory if provided
    if (inventory && Array.isArray(inventory)) {
      // First, get existing inventory to compare
      const { data: existingInventory } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId);

      // Update or insert inventory items
      const inventoryUpdates = inventory.map(async (item) => {
        const existingItem = existingInventory?.find(ei => ei.item_id === item.item_id);
        
        if (existingItem) {
          // Update existing item
          const { data, error } = await supabase
            .from('user_inventory')
            .update({
              quantity: item.quantity,
              equipped: item.equipped
            })
            .eq('id', existingItem.id)
            .select()
            .single();

          return { item_id: item.item_id, success: !error, error: error?.message };
        } else {
          // Insert new item
          const { data, error } = await supabase
            .from('user_inventory')
            .insert({
              user_id: userId,
              item_id: item.item_id,
              item_type: item.item_type,
              quantity: item.quantity,
              equipped: item.equipped
            })
            .select()
            .single();

          return { item_id: item.item_id, success: !error, error: error?.message };
        }
      });

      const inventoryResults = await Promise.all(inventoryUpdates);
      results.inventory = inventoryResults;
    }

    // Update subscriptions if provided
    if (subscriptions && Array.isArray(subscriptions)) {
      const subscriptionUpdates = subscriptions.map(async (sub) => {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            subscription_type: sub.subscription_type,
            status: sub.status,
            provider: sub.provider,
            external_id: sub.external_id,
            started_at: sub.started_at,
            expires_at: sub.expires_at
          })
          .select()
          .single();

        return { 
          subscription_type: sub.subscription_type, 
          success: !error, 
          error: error?.message 
        };
      });

      const subscriptionResults = await Promise.all(subscriptionUpdates);
      results.subscriptions = subscriptionResults;
    }

    // Add purchases if provided
    if (purchases && Array.isArray(purchases)) {
      const purchaseInserts = purchases.map(async (purchase) => {
        const { data, error } = await supabase
          .from('user_purchases')
          .insert({
            user_id: userId,
            item_id: purchase.item_id,
            item_type: purchase.item_type,
            price_coins: purchase.price_coins,
            price_sparks: purchase.price_sparks
          })
          .select()
          .single();

        return { 
          item_id: purchase.item_id, 
          success: !error, 
          error: error?.message 
        };
      });

      const purchaseResults = await Promise.all(purchaseInserts);
      results.purchases = purchaseResults;
    }

    // Note: user_achievements table has been removed as part of database cleanup
    // Achievement functionality can be re-added when the achievement system is implemented

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('User sync update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

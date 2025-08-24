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

    // Fetch user data from available tables
    const [
      { data: player, error: playerError },
      { data: profile, error: profileError }
    ] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
    ]);

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
      
      // Also create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
        const defaultProfile = {
          user_id: userId,
          display_name: defaultPlayer.display_name || 'Adventurer',
          created_at: new Date().toISOString()
        };
        
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert(defaultProfile);
        
        if (profileCreateError) {
          console.error('Error creating default profile:', profileCreateError);
        }
      }
    }

    // Return user data with available information
    return NextResponse.json({
      success: true,
      data: {
        player: playerData || null,
        profile: profile || null,
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
      console.error('POST: No user ID found. Auth header:', request.headers.get('authorization'));
      console.error('POST: Cookie wallet user:', cookieStore.get('wallet-user'));
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    const results: any = {};

    // Update player data if provided
    if (player) {
      // Update both players and profiles tables to keep them in sync
      const updatePromises = [];
      
      // Update players table
      updatePromises.push(
        supabase
          .from('players')
          .update({
            display_name: player.display_name,
            level: player.level,
            xp: player.xp,
            coins: player.coins,
            sparks: player.sparks
          })
          .eq('user_id', userId)
          .select()
          .single()
      );
      
      // Update profiles table if display_name is provided
      if (player.display_name) {
        updatePromises.push(
          supabase
            .from('profiles')
            .update({
              display_name: player.display_name
            })
            .eq('user_id', userId)
            .select()
            .single()
        );
      }
      
      // Wait for both updates to complete
      const [playerResult, profileResult] = await Promise.all(updatePromises);
      
      if (playerResult.error) {
        console.error('Error updating player:', playerResult.error);
        results.player = { error: playerResult.error.message };
      } else {
        results.player = { success: true, data: playerResult.data };
      }
      
      // Log profile update result (but don't fail the whole operation if it fails)
      if (profileResult && profileResult.error) {
        console.error('Error updating profile:', profileResult.error);
      } else if (profileResult) {
        console.log('Profile updated successfully');
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

    // Update achievements if provided
    if (achievements && Array.isArray(achievements)) {
      const achievementUpdates = achievements.map(async (achievement) => {
        const { data, error } = await supabase
          .from('user_achievements')
          .upsert({
            user_id: userId,
            achievement_id: achievement.achievement_id,
            progress: achievement.progress,
            completed: achievement.completed,
            completed_at: achievement.completed_at
          })
          .select()
          .single();

        return { 
          achievement_id: achievement.achievement_id, 
          success: !error, 
          error: error?.message 
        };
      });

      const achievementResults = await Promise.all(achievementUpdates);
      results.achievements = achievementResults;
    }

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

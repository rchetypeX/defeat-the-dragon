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
    const supabase = createServerClient(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Fetch all user data in parallel
    const [
      { data: player, error: playerError },
      { data: settings, error: settingsError },
      { data: inventory, error: inventoryError },
      { data: subscriptions, error: subscriptionsError },
      { data: purchases, error: purchasesError },
      { data: achievements, error: achievementsError }
    ] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false }),
      supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
    ]);

    // Check for errors
    if (playerError) {
      console.error('Error fetching player data:', playerError);
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      );
    }

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json(
        { error: 'Failed to fetch purchases' },
        { status: 500 }
      );
    }

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Return comprehensive user data
    return NextResponse.json({
      success: true,
      data: {
        player: player || null,
        settings: settings || null,
        inventory: inventory || [],
        subscriptions: subscriptions || [],
        purchases: purchases || [],
        achievements: achievements || []
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
    const supabase = createServerClient(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
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
      const { data, error } = await supabase
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
        .single();

      if (error) {
        console.error('Error updating player:', error);
        results.player = { error: error.message };
      } else {
        results.player = { success: true, data };
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

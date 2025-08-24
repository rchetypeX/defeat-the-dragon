import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Try to get user from session first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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

    const body = await request.json();
    const { itemId, itemType, price, currency } = body;

    if (!itemId || !itemType || !price || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, itemType, price, currency' },
        { status: 400 }
      );
    }

    // Check if user already owns this item
    const { data: existingItem, error: inventoryError } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .single();

    if (inventoryError && inventoryError.code !== 'PGRST116') {
      console.error('Error checking inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to check inventory' },
        { status: 500 }
      );
    }

    if (existingItem) {
      return NextResponse.json(
        { error: 'You already own this item' },
        { status: 409 }
      );
    }

    // Get user's current currency
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('coins, sparks')
      .eq('user_id', userId)
      .single();

    if (playerError) {
      console.error('Error fetching player data:', playerError);
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      );
    }

    // Check if user has enough currency
    const currentBalance = currency === 'coins' ? player.coins : player.sparks;
    if (currentBalance < price) {
      return NextResponse.json(
        { error: `Insufficient ${currency}. You have ${currentBalance} ${currency}, but need ${price} ${currency}.` },
        { status: 402 }
      );
    }

    // Update player currency
    const updateData: any = {};
    if (currency === 'coins') {
      updateData.coins = player.coins - price;
    } else if (currency === 'sparks') {
      updateData.sparks = player.sparks - price;
    }

    const { error: updateError } = await supabase
      .from('players')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating player currency:', updateError);
      return NextResponse.json(
        { error: 'Failed to update currency' },
        { status: 500 }
      );
    }

    // Add item to inventory
    const { error: inventoryInsertError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
        quantity: 1,
        equipped: false,
        acquired_at: new Date().toISOString()
      });

    if (inventoryInsertError) {
      console.error('Error adding item to inventory:', inventoryInsertError);
      return NextResponse.json(
        { error: 'Failed to add item to inventory' },
        { status: 500 }
      );
    }

    // Record the purchase
    const { error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
        price_coins: currency === 'coins' ? price : 0,
        price_sparks: currency === 'sparks' ? price : 0
      });

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      // Don't fail the purchase if we can't record it
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase completed successfully'
    });

  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
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

    // Test database connection first
    console.log('Testing database connection...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('user_inventory')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        return NextResponse.json(
          { error: 'Database connection failed', details: testError.message },
          { status: 500 }
        );
      }
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection error', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Try to get user from session first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    let userId: string | null = null;
    let authMethod: string = 'none';
    
    if (user) {
      // Standard Supabase auth user
      userId = user.id;
      authMethod = 'supabase_session';
      console.log('User authenticated via Supabase session:', userId);
    } else {
      // Check for Bearer token in Authorization header
      const authHeader = request.headers.get('authorization');
      console.log('Auth header received:', authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer '
        
        // If it's a Supabase access token, verify it
        if (token && !token.startsWith('wallet:') && !token.startsWith('baseapp:')) {
          try {
            // Verify the token with Supabase
            const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
            if (tokenUser && !tokenError) {
              userId = tokenUser.id;
              authMethod = 'bearer_token';
              console.log('User authenticated via Bearer token:', userId);
            } else {
              console.error('Token verification failed:', tokenError);
            }
          } catch (e) {
            console.error('Error verifying token:', e);
          }
        }
        
        // Check if this is a wallet user
        if (!userId && authHeader.startsWith('Bearer wallet:')) {
          try {
            const walletData = JSON.parse(authHeader.substring(15)); // Remove 'Bearer wallet:'
            userId = walletData.id;
            authMethod = 'wallet';
            console.log('User authenticated via wallet:', userId);
          } catch (e) {
            console.error('Error parsing wallet user from header:', e);
          }
        }
        
        // Check if this is a Base App user
        if (!userId && authHeader.startsWith('Bearer baseapp:')) {
          try {
            const baseAppData = JSON.parse(authHeader.substring(15)); // Remove 'Bearer baseapp:'
            userId = baseAppData.id;
            authMethod = 'baseapp';
            console.log('User authenticated via Base App:', userId);
          } catch (e) {
            console.error('Error parsing Base App user from header:', e);
          }
        }
      }
      
      // Fallback: Check if this is a wallet user by looking for wallet address in cookies
      if (!userId) {
        const walletUser = cookieStore.get('wallet-user');
        if (walletUser) {
          try {
            const walletData = JSON.parse(walletUser.value);
            userId = walletData.id;
            authMethod = 'wallet_cookie';
            console.log('User authenticated via wallet cookie:', userId);
          } catch (e) {
            console.error('Error parsing wallet user data:', e);
          }
        }
      }
    }
    
    console.log('Final auth result:', { userId, authMethod, authError });
    
    if (!userId) {
      console.error('Authentication failed - no valid user ID found');
      console.error('Auth header:', request.headers.get('authorization'));
      console.error('Cookies:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value })));
      console.error('Supabase session error:', authError);
      
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to make purchases' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId, itemType, price, currency } = body;

    // Debug logging
    console.log('Purchase request body:', { itemId, itemType, price, currency });
    console.log('User ID:', userId);
    console.log('Auth method:', authMethod);

    if (!itemId || !itemType || price === undefined || price === null || !currency) {
      console.log('Validation failed:', { 
        hasItemId: !!itemId, 
        hasItemType: !!itemType, 
        price, 
        hasCurrency: !!currency 
      });
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

    // Note: We don't return an error if they already own the item
    // Instead, we'll handle it in the inventory update logic below
    if (existingItem) {
      console.log('User already owns this item, will update quantity');
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
    
    console.log('Player data fetched:', { coins: player.coins, sparks: player.sparks });

    // Check if user has enough currency (only for paid items)
    if (price > 0) {
      const currentBalance = currency === 'coins' ? player.coins : player.sparks;
      if (currentBalance < price) {
        return NextResponse.json(
          { error: `Insufficient ${currency}. You have ${currentBalance} ${currency}, but need ${price} ${currency}.` },
          { status: 402 }
        );
      }

      // Update player currency (only for paid items)
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
    } else {
      console.log('Skipping currency update for free item (price = 0)');
    }

    // Check if user already owns this item (second check after currency update)
    const { data: existingInventoryItem, error: checkError } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing inventory:', checkError);
      return NextResponse.json(
        { error: 'Failed to check inventory' },
        { status: 500 }
      );
    }

    if (existingInventoryItem) {
      console.log('User already owns this item, updating quantity');
      // Update quantity if user already owns the item
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({ quantity: existingInventoryItem.quantity + 1 })
        .eq('id', existingInventoryItem.id);

      if (updateError) {
        console.error('Error updating item quantity:', updateError);
        return NextResponse.json(
          { error: 'Failed to update item quantity' },
          { status: 500 }
        );
      }
    } else {
      // Add new item to inventory
      console.log('Adding new item to inventory:', {
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
        quantity: 1,
        equipped: false,
        acquired_at: new Date().toISOString()
      });
      
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
        console.error('Insert details:', {
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
          quantity: 1,
          equipped: false,
          acquired_at: new Date().toISOString()
        });
        return NextResponse.json(
          { error: 'Failed to add item to inventory', details: inventoryInsertError.message },
          { status: 500 }
        );
      }
      
      console.log('Successfully added item to inventory');
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
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Log the request context
    console.error('Request context:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}

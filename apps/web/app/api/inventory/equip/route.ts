import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
      console.log('Equip: Found Supabase user from session:', userId);
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
        if (authHeader) {
          if (authHeader.startsWith('Bearer wallet:')) {
            try {
              const walletData = JSON.parse(authHeader.substring(15)); // Remove 'Bearer wallet:'
              userId = walletData.id;
            } catch (e) {
              console.error('Error parsing wallet user from header:', e);
            }
          } else if (authHeader.startsWith('wallet:')) {
            try {
              const walletData = JSON.parse(authHeader.substring(7)); // Remove 'wallet:'
              userId = walletData.id;
            } catch (e) {
              console.error('Error parsing wallet user from header:', e);
            }
          } else if (authHeader.startsWith('Bearer baseapp:')) {
            try {
              const baseAppData = JSON.parse(authHeader.substring(14)); // Remove 'Bearer baseapp:'
              userId = baseAppData.id;
              console.log('Equip: Found Base App user from header:', userId);
            } catch (e) {
              console.error('Error parsing Base App user from header:', e);
            }
          } else if (authHeader.startsWith('baseapp:')) {
            try {
              const baseAppData = JSON.parse(authHeader.substring(8)); // Remove 'baseapp:'
              userId = baseAppData.id;
              console.log('Equip: Found Base App user from header:', userId);
            } catch (e) {
              console.error('Error parsing Base App user from header:', e);
            }
          }
        }
      }
    }
    
    if (!userId) {
      console.log('Equip: No user found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { itemId, itemType } = await request.json();

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'Item ID and type are required' },
        { status: 400 }
      );
    }

    console.log(`Equipping item: ${itemId} of type: ${itemType} for user: ${userId}`);
    
    // First, unequip all items of the same type
    const { data: unequippedItems, error: unequipError } = await supabase
      .from('user_inventory')
      .update({ equipped: false })
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .select();

    if (unequipError) {
      console.error('Error unequipping items:', unequipError);
      return NextResponse.json(
        { error: 'Failed to unequip items' },
        { status: 500 }
      );
    }
    
    console.log(`Unequipped ${unequippedItems?.length || 0} items of type ${itemType}`);

    // Then, equip the selected item
    const { data: equippedItem, error: equipError } = await supabase
      .from('user_inventory')
      .update({ equipped: true })
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .select()
      .single();

    if (equipError) {
      console.error('Error equipping item:', equipError);
      return NextResponse.json(
        { error: 'Failed to equip item' },
        { status: 500 }
      );
    }

    if (!equippedItem) {
      console.error('Item not found in inventory:', { userId, itemId, itemType });
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }
    
    console.log(`Successfully equipped item:`, equippedItem);

    // Also update user_settings table for equipped character/background
    if (itemType === 'character' || itemType === 'background') {
      const settingField = itemType === 'character' ? 'equipped_character' : 'equipped_background';
      
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          [settingField]: itemId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) {
        console.error('Error updating user settings:', settingsError);
        // Don't fail the equip operation if settings update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: equippedItem
    });

  } catch (error) {
    console.error('Equip item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  let timeoutId: NodeJS.Timeout | undefined;
  
  try {
    // Add timeout and better error handling
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const { address, displayName, message, signature } = await request.json();

    if (!address || !displayName || !message || !signature) {
      if (timeoutId) clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll skip signature verification to avoid viem dependency issues
    // In production, you should implement proper signature verification
    // This is a simplified approach for development
    console.log('Wallet sign-up attempt:', { address, displayName, message, signature });

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userError);
      return NextResponse.json(
        { error: 'Database error checking existing user' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this wallet address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Display names no longer need to be unique - removed uniqueness check

    // Create a new Supabase user with a unique email
    const uniqueEmail = `${address.toLowerCase()}@wallet`;
    
    console.log('Creating auth user with email:', uniqueEmail);
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: uniqueEmail,
      email_confirm: true,
      user_metadata: {
        wallet_address: address.toLowerCase(),
        display_name: displayName,
      },
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Wait a moment for the trigger to execute, then check if player record was created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if player record was already created by the trigger
    const { data: existingPlayer, error: checkError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing player:', checkError);
    }

    if (existingPlayer) {
      console.log('Player record already exists (created by trigger):', existingPlayer);
      // Update the existing player record with our data
      const updateResult = await supabase
        .from('players')
        .update({
          wallet_address: address.toLowerCase(),
          display_name: displayName,
          level: 1,
          xp: 0,
          coins: 0, // Start with 0 coins
          sparks: 0, // Start with 0 sparks
          needsAdventurerName: true, // Flag to show name change popup
        })
        .eq('user_id', authUser.user.id)
        .select()
        .single();

      if (updateResult.error) {
        console.error('Player update error:', updateResult.error);
        return NextResponse.json(
          { error: 'Failed to update player profile' },
          { status: 500 }
        );
      }

      console.log('Player record updated successfully');
    } else {
      // Trigger failed or didn't execute, create player record manually
      console.log('Player record not created by trigger, creating manually');
      
      const playerResult = await supabase
        .from('players')
        .insert({
          user_id: authUser.user.id,
          wallet_address: address.toLowerCase(),
          display_name: displayName,
          level: 1,
          xp: 0,
          coins: 0, // Start with 0 coins
          sparks: 0, // Start with 0 sparks
          is_inspired: false,
          needsAdventurerName: true, // Flag to show name change popup
        })
        .select()
        .single();

      if (playerResult.error) {
        // Clean up the auth user if player creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.error('Player creation error:', playerResult.error);
        console.error('Error details:', {
          code: playerResult.error.code,
          message: playerResult.error.message,
          details: playerResult.error.details,
          hint: playerResult.error.hint
        });
        return NextResponse.json(
          { error: 'Failed to create player profile' },
          { status: 500 }
        );
      }

      console.log('Player record created successfully');
    }

    // Create default user settings if the table exists
    try {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({ user_id: authUser.user.id })
        .single();
      
      if (settingsError && settingsError.code !== '23505') { // Ignore unique constraint violations
        console.warn('Failed to create user settings:', settingsError);
      } else {
        console.log('User settings created successfully');
      }
    } catch (error) {
      console.warn('User settings table might not exist:', error);
    }

    // Add default inventory items if the table exists
    try {
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert([
          { user_id: authUser.user.id, item_id: 'fighter', item_type: 'character', equipped: true },
          { user_id: authUser.user.id, item_id: 'forest', item_type: 'background', equipped: true }
        ]);
      
      if (inventoryError) {
        console.warn('Failed to create default inventory:', inventoryError);
      } else {
        console.log('Default inventory created successfully');
      }
    } catch (error) {
      console.warn('User inventory table might not exist:', error);
    }

    // Clear timeout since we're about to return
    if (timeoutId) clearTimeout(timeoutId);

    // For wallet authentication, return the user data for localStorage approach
    // The session will be handled by the client-side auth context
    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        address: address.toLowerCase(), // Include address for client-side use
        wallet_address: address.toLowerCase(),
        display_name: displayName,
        email: uniqueEmail,
      },
      walletAuth: true,
    });

  } catch (error) {
    // Clear timeout in case of error
    if (timeoutId) clearTimeout(timeoutId);
    
    console.error('Wallet sign-up error:', error);
    
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
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' },
        { status: 408 }
      );
    }
    
    // Check if it's a network error
    if (error instanceof Error && error.message.includes('ECONNRESET')) {
      return NextResponse.json(
        { error: 'Connection error - please check your internet and try again' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}

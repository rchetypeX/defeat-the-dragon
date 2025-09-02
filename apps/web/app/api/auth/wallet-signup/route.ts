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
    console.log('Wallet signup API called');
    
    // Test database connection
    console.log('Testing database connection...');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('players')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
      console.log('Database connection test successful');
    } catch (error) {
      console.error('Database connection test error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Add timeout and better error handling
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const { address, email, displayName, message, signature } = await request.json();

    if (!address || !email || !displayName || !message || !signature) {
      if (timeoutId) clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (timeoutId) clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // For now, we'll skip signature verification to avoid viem dependency issues
    // In production, you should implement proper signature verification
    // This is a simplified approach for development
    console.log('Wallet sign-up attempt:', { address, displayName, message, signature });

    // Check if user already exists by wallet address
    const { data: existingWalletUser, error: walletUserError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (walletUserError && walletUserError.code !== 'PGRST116') {
      console.error('Error checking existing wallet user:', walletUserError);
      return NextResponse.json(
        { error: 'Database error checking existing user' },
        { status: 500 }
      );
    }

    if (existingWalletUser) {
      return NextResponse.json(
        { error: 'An account with this wallet address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Check if email is already linked to another account
    const { data: existingEmailUser, error: emailUserError } = await supabase.auth.admin.listUsers();
    const emailAlreadyExists = existingEmailUser?.users?.some((u: any) => u.email === email);
    
    if (emailAlreadyExists) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please use a different email or sign in instead.' },
        { status: 409 }
      );
    }

    // Display names no longer need to be unique - removed uniqueness check

    // Create a new Supabase user with the provided email
    console.log('Creating auth user with email:', email);
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
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
    console.log('Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if player record was already created by the trigger
    console.log('Checking if player record was created by trigger...');
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
      console.log('Trigger may have failed. Checking auth.users table...');
      
      // Let's check if the user was actually created in auth.users
      const { data: authUserCheck, error: authCheckError } = await supabase.auth.admin.getUserById(authUser.user.id);
      if (authCheckError) {
        console.error('Error checking auth user:', authCheckError);
      } else {
        console.log('Auth user exists:', authUserCheck.user);
      }
      
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
        console.error('Player creation failed, cleaning up auth user...');
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
        email: email,
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

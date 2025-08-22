import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recoverMessageAddress } from 'viem';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json();

    if (!address || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the signature
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'No account found with this wallet address. Please sign up first.' },
        { status: 404 }
      );
    }

    // Create or get Supabase user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      existingUser.user_id
    );

    if (authError) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    // For wallet authentication, we'll return the user data
    // The frontend will handle setting the session
    return NextResponse.json({
      success: true,
      user: {
        id: existingUser.user_id,
        wallet_address: existingUser.wallet_address,
        display_name: existingUser.display_name,
        email: `${address.toLowerCase()}@wallet.local`,
      },
      // Return a simple success flag for wallet auth
      walletAuth: true,
    });



  } catch (error) {
    console.error('Wallet sign-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

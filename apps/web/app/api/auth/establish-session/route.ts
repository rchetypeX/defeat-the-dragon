import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json();
    
    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and user type are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // For Base App users, we need to find the Supabase user by the stored user_id
    if (userType === 'baseapp') {
      // The userId should be the Supabase user ID stored in localStorage
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error) {
        console.error('Error getting user by ID:', error);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (!user.user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Create a session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.user.email!,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}/auth/callback`
        }
      });

      if (sessionError) {
        console.error('Error generating session link:', sessionError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.user.id,
          email: user.user.email,
          user_metadata: user.user.user_metadata
        },
        session: sessionData
      });
    }

    // For other user types, return the user data
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        type: userType
      }
    });

  } catch (error) {
    console.error('Session establishment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

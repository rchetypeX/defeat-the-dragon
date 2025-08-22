import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if we have the service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key') {
      console.log('API: Service role key not configured, using fallback method');
      
      // Fallback: Try to sign in with a dummy password to check if user exists
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        console.log('API: Attempting fallback email check for:', email);
        
        // Try to sign in with the email and a dummy password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'dummy-password-for-check'
        });

        console.log('API: Fallback check result:', error?.message);

        // If we get an "Invalid login credentials" error, it means the user exists
        // If we get a "User not found" error, it means the user doesn't exist
        if (error) {
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Invalid email or password') ||
              error.message.includes('Email not confirmed') ||
              error.message.includes('Invalid login credentials')) {
            // User exists but password is wrong
            console.log('API: User exists (invalid credentials)');
            return NextResponse.json({
              exists: true,
              message: 'An account with this email already exists'
            });
          } else if (error.message.includes('User not found') ||
                     error.message.includes('Unable to validate email address')) {
            // User doesn't exist
            console.log('API: User does not exist');
            return NextResponse.json({
              exists: false,
              message: 'Email is available'
            });
          }
        }
      } catch (signInError) {
        console.error('API: Sign in check error:', signInError);
      }

      // If we can't determine, assume user doesn't exist to allow signup
      console.log('API: Could not determine email availability, allowing signup');
      return NextResponse.json({
        exists: false,
        message: 'Email availability could not be determined'
      });
    }

    // Use service role key if available
    console.log('API: Using service role key for email check');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    try {
      // Check if user exists by trying to get user by email
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('API: Service role check error:', error);
        throw error;
      }

      const userExists = users?.users?.some((user: any) => user.email === email) || false;
      console.log('API: Service role check result - user exists:', userExists);

      return NextResponse.json({
        exists: userExists,
        message: userExists 
          ? 'An account with this email already exists' 
          : 'Email is available'
      });
    } catch (serviceError) {
      console.error('API: Service role check failed, falling back to dummy method:', serviceError);
      
      // Fall back to the dummy password method
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'dummy-password-for-check'
        });

        if (error) {
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Invalid email or password') ||
              error.message.includes('Email not confirmed')) {
            return NextResponse.json({
              exists: true,
              message: 'An account with this email already exists'
            });
          } else if (error.message.includes('User not found') ||
                     error.message.includes('Unable to validate email address')) {
            return NextResponse.json({
              exists: false,
              message: 'Email is available'
            });
          }
        }
      } catch (fallbackError) {
        console.error('API: Fallback check also failed:', fallbackError);
      }

      // If all methods fail, allow signup
      return NextResponse.json({
        exists: false,
        message: 'Email availability could not be determined'
      });
    }

  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

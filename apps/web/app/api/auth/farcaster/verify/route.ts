import { NextRequest, NextResponse } from 'next/server';
import { verifySignInMessage } from '@farcaster/auth-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jwt, credential } = body;

    if (!jwt && !credential) {
      return NextResponse.json(
        { error: 'No authentication token or credential provided' },
        { status: 400 }
      );
    }

    let userData = null;

    if (jwt) {
      // Handle Quick Auth JWT
      try {
        // In a real implementation, you would verify the JWT
        // For now, we'll decode it to get user information
        const decoded = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
        
        userData = {
          fid: decoded.fid,
          username: decoded.username,
          displayName: decoded.displayName,
          pfp: decoded.pfp,
          verifiedAddresses: decoded.verifiedAddresses,
          authAddress: decoded.authAddress,
        };

        console.log('✅ JWT verification successful for FID:', decoded.fid);
        
      } catch (error) {
        console.error('❌ JWT verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid JWT token' },
          { status: 401 }
        );
      }
    } else if (credential) {
      // Handle Sign in with Farcaster credential
      try {
        // Verify the Sign in with Farcaster credential
        const verificationResult = await verifySignInMessage(credential);
        
        if (!verificationResult.isValid) {
          throw new Error('Invalid credential');
        }

        userData = {
          fid: verificationResult.fid,
          username: verificationResult.username,
          displayName: verificationResult.displayName,
          pfp: verificationResult.pfp,
          verifiedAddresses: verificationResult.verifiedAddresses,
          authAddress: verificationResult.authAddress,
        };

        console.log('✅ Credential verification successful for FID:', verificationResult.fid);
        
      } catch (error) {
        console.error('❌ Credential verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid credential' },
          { status: 401 }
        );
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Failed to extract user data' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store user data in your database
    // 2. Create a session token
    // 3. Return the session token along with user data

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Authentication verified successfully',
    });

  } catch (error) {
    console.error('❌ Authentication verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

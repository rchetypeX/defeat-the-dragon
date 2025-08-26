import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Check for wallet user in cookie
    const walletUser = cookieStore.get('wallet-user');
    let userId: string | null = null;
    let authMethod = 'none';
    
    if (walletUser) {
      try {
        const walletData = JSON.parse(walletUser.value);
        userId = walletData.id;
        authMethod = 'cookie';
        console.log('Test: Found wallet user in cookie:', userId);
      } catch (e) {
        console.error('Test: Error parsing wallet user data:', e);
      }
    }
    
    // Check for wallet user in header
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer wallet:')) {
        try {
          const walletData = JSON.parse(authHeader.substring(15));
          userId = walletData.id;
          authMethod = 'header';
          console.log('Test: Found wallet user in header:', userId);
        } catch (e) {
          console.error('Test: Error parsing wallet user from header:', e);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      userId,
      authMethod,
      hasWalletUser: !!userId,
      message: userId ? 'Authentication found' : 'No authentication found'
    });
    
  } catch (error) {
    console.error('Test: Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('API: Test endpoint called');
  return NextResponse.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  console.log('API: Test POST endpoint called');
  const body = await request.json();
  return NextResponse.json({ 
    message: 'Test POST endpoint working', 
    receivedData: body,
    timestamp: new Date().toISOString() 
  });
}

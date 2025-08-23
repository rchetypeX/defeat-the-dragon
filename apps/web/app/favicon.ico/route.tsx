import { ImageResponse } from 'next/og';

// export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
        }}
      >
        🐉⚔️
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  );
}

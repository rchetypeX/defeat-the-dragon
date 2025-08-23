import { ImageResponse } from 'next/og'
 
// Route segment config
// export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
// Image generation
export default function TwitterImage() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: 200, marginBottom: 20 }}>🐉⚔️</div>
        <div style={{ fontSize: 64, marginBottom: 20 }}>Defeat the Dragon</div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>Focus. Train. Conquer.</div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}

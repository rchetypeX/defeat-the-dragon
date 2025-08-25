import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Defeat the Dragon - Focus RPG'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 630,
}
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '40px',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(242, 117, 26, 0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Game Logo/Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#f2751a',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              marginBottom: '20px',
              fontFamily: 'monospace',
            }}
          >
            🐉 DEFEAT THE DRAGON
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: '32px',
              color: '#fbbf24',
              marginBottom: '40px',
              fontWeight: '600',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            Focus • Train • Conquer
          </div>
          
          {/* Game Elements */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '40px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
              }}
            >
              ⚔️
            </div>
            <div
              style={{
                fontSize: '48px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
              }}
            >
              🧙‍♂️
            </div>
            <div
              style={{
                fontSize: '48px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
              }}
            >
              🎯
            </div>
          </div>
          
          {/* Description */}
          <div
            style={{
              fontSize: '24px',
              color: '#ffffff',
              maxWidth: '800px',
              lineHeight: '1.4',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions
          </div>
        </div>
        
        {/* Bottom Accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #f2751a 0%, #fbbf24 50%, #f2751a 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}

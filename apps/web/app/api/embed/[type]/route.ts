import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import React from 'react';

export const runtime = 'edge';

interface EmbedParams {
  type: string;
}

export async function GET(request: NextRequest, { params }: { params: EmbedParams }) {
  try {
    const { searchParams } = new URL(request.url);
    const type = params.type;
    
    // Extract parameters for dynamic content
    const level = searchParams.get('level');
    const xp = searchParams.get('xp');
    const coins = searchParams.get('coins');
    const sparks = searchParams.get('sparks');
    const duration = searchParams.get('duration');
    const streak = searchParams.get('streak');
    const bossName = searchParams.get('boss');

    // Generate dynamic content based on type
    let title = 'Defeat the Dragon';
    let subtitle = 'Transform focus into adventure!';
    let emoji = '🐉';
    let color = '#f2751a';

    switch (type) {
      case 'level_up':
        title = `Level ${level} Achieved!`;
        subtitle = `Leveling up the focus game!`;
        emoji = '🎉';
        color = '#4ade80';
        break;
      
      case 'session_complete':
        title = `${duration}min Focus Session`;
        subtitle = `+${xp} XP • +${coins} coins${sparks ? ` • +${sparks} sparks` : ''}`;
        emoji = '✅';
        color = '#3b82f6';
        break;
      
      case 'boss_defeated':
        title = `${bossName} Defeated!`;
        subtitle = 'Focus training pays off!';
        emoji = '⚔️';
        color = '#dc2626';
        break;
      
      case 'milestone':
        title = 'Major Milestone!';
        subtitle = 'Every session brings you closer!';
        emoji = '🏆';
        color = '#f59e0b';
        break;
      
      case 'streak':
        title = `${streak} Day Streak!`;
        subtitle = 'Consistency is the key!';
        emoji = '🔥';
        color = '#ef4444';
        break;
      
      default:
        title = 'Defeat the Dragon';
        subtitle = 'Transform focus into adventure!';
        emoji = '🐉';
        color = '#f2751a';
    }

    return new ImageResponse(
      React.createElement('div', {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '40px',
          position: 'relative',
        },
      }, [
        // Background Pattern
        React.createElement('div', {
          key: 'bg',
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(242, 117, 26, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            opacity: 0.3,
          },
        }),
        // Main Content
        React.createElement('div', {
          key: 'content',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 1,
          },
        }, [
          // Emoji
          React.createElement('div', {
            key: 'emoji',
            style: {
              fontSize: '80px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
            },
          }, emoji),
          // Title
          React.createElement('div', {
            key: 'title',
            style: {
              fontSize: '48px',
              fontWeight: 'bold',
              color: color,
              marginBottom: '16px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              maxWidth: '600px',
              lineHeight: 1.2,
            },
          }, title),
          // Subtitle
          React.createElement('div', {
            key: 'subtitle',
            style: {
              fontSize: '24px',
              color: '#fbbf24',
              marginBottom: '32px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
              maxWidth: '500px',
              lineHeight: 1.3,
            },
          }, subtitle),
          // App Branding
          React.createElement('div', {
            key: 'branding',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              backgroundColor: 'rgba(242, 117, 26, 0.1)',
              border: '2px solid rgba(242, 117, 26, 0.3)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            },
          }, [
            React.createElement('div', {
              key: 'brand-text',
              style: {
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#f2751a',
              },
            }, '🐉 Defeat the Dragon'),
          ]),
        ]),
        // Bottom Gradient
        React.createElement('div', {
          key: 'gradient',
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(to top, rgba(26, 26, 46, 0.8) 0%, transparent 100%)',
          },
        }),
      ]),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
        },
      }
    );
  } catch (error) {
    console.error('Error generating embed image:', error);
    
    // Fallback to static embed
    return new ImageResponse(
      React.createElement('div', {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '40px',
        },
      }, [
        React.createElement('div', {
          key: 'emoji',
          style: {
            fontSize: '80px',
            marginBottom: '20px',
          },
        }, '🐉'),
        React.createElement('div', {
          key: 'title',
          style: {
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#f2751a',
            marginBottom: '16px',
            textAlign: 'center',
          },
        }, 'Defeat the Dragon'),
        React.createElement('div', {
          key: 'subtitle',
          style: {
            fontSize: '24px',
            color: '#fbbf24',
            textAlign: 'center',
          },
        }, 'Transform focus into adventure!'),
      ]),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      }
    );
  }
}

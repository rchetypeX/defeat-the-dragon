/**
 * Request notification permission and show notifications
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showSessionCompleteNotification(xpGained: number, coinsGained: number) {
  if (Notification.permission === 'granted') {
    new Notification('🎉 Session Complete!', {
      body: `You gained ${xpGained} XP and ${coinsGained} coins!`,
      icon: '/icons/icon-144x144.png',
      badge: '/icons/icon-144x144.png',
      tag: 'session-complete',
      requireInteraction: false,
    });
  }
}

export function showSessionFailedNotification() {
  if (Notification.permission === 'granted') {
    new Notification('❌ Session Failed', {
      body: 'Your focus session was interrupted. Try again!',
      icon: '/icons/icon-144x144.png',
      badge: '/icons/icon-144x144.png',
      tag: 'session-failed',
      requireInteraction: false,
    });
  }
}

export function showSoftShieldWarningNotification(remainingTime: number) {
  if (Notification.permission === 'granted') {
    new Notification('⚠️ Focus Interrupted!', {
      body: `You've been away too long! Return within ${remainingTime} seconds or your session will fail!`,
      icon: '/icons/icon-144x144.png',
      badge: '/icons/icon-144x144.png',
      tag: 'soft-shield-warning',
      requireInteraction: true,
    });
  }
}

// In-memory storage for notification tokens (replace with database in production)
const notificationTokens = new Map<string, { token: string; url: string; fid: string }>();

// Helper function to get notification tokens for a user
export function getNotificationTokens(fid: string): { token: string; url: string }[] {
  const tokens: { token: string; url: string }[] = [];
  
  for (const [key, value] of notificationTokens.entries()) {
    if (value.fid === fid) {
      tokens.push({
        token: value.token,
        url: value.url,
      });
    }
  }
  
  return tokens;
}

// Helper function to add notification token
export function addNotificationToken(fid: string, clientApp: string, token: string, url: string) {
  const key = `${fid}-${clientApp}`;
  notificationTokens.set(key, {
    token,
    url,
    fid,
  });
}

// Helper function to remove notification tokens for a user
export function removeNotificationTokens(fid: string) {
  for (const [key, value] of notificationTokens.entries()) {
    if (value.fid === fid) {
      notificationTokens.delete(key);
    }
  }
}

// Helper function to send notifications
export async function sendNotification(
  notificationId: string,
  title: string,
  body: string,
  targetUrl: string,
  tokens: string[]
): Promise<{
  successfulTokens: string[];
  invalidTokens: string[];
  rateLimitedTokens: string[];
}> {
  if (tokens.length === 0) {
    return {
      successfulTokens: [],
      invalidTokens: [],
      rateLimitedTokens: [],
    };
  }
  
  // Group tokens by URL (different clients may have different URLs)
  const tokensByUrl = new Map<string, string[]>();
  
  for (const token of tokens) {
    // In a real implementation, you'd look up the URL for each token
    // For now, we'll use a default URL
    const url = 'https://api.farcaster.xyz/v1/frame-notifications';
    
    if (!tokensByUrl.has(url)) {
      tokensByUrl.set(url, []);
    }
    tokensByUrl.get(url)!.push(token);
  }
  
  const successfulTokens: string[] = [];
  const invalidTokens: string[] = [];
  const rateLimitedTokens: string[] = [];
  
  // Send notifications to each URL
  for (const [url, urlTokens] of tokensByUrl.entries()) {
    try {
      // Batch tokens (max 100 per request)
      const batches = [];
      for (let i = 0; i < urlTokens.length; i += 100) {
        batches.push(urlTokens.slice(i, i + 100));
      }
      
      for (const batch of batches) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId,
            title,
            body,
            targetUrl,
            tokens: batch,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          successfulTokens.push(...result.successfulTokens);
          invalidTokens.push(...result.invalidTokens);
          rateLimitedTokens.push(...result.rateLimitedTokens);
        } else {
          console.error('Failed to send notification batch:', response.status);
          // Assume all tokens in this batch failed
          invalidTokens.push(...batch);
        }
      }
    } catch (error) {
      console.error('Error sending notifications to URL:', url, error);
      // Assume all tokens for this URL failed
      invalidTokens.push(...urlTokens);
    }
  }
  
  return {
    successfulTokens,
    invalidTokens,
    rateLimitedTokens,
  };
}

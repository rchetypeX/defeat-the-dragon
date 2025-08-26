import { getNotificationTokens, sendNotification } from './webhookUtils';

// Rate limiting cache (in production, use Redis or database)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Notification deduplication cache (24-hour window)
const deduplicationCache = new Map<string, number>();

export interface NotificationData {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  fid: string;
}

export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Send a notification to a specific user
   */
  async sendToUser(notificationData: NotificationData): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Check rate limits
      const rateLimitKey = `user-${notificationData.fid}`;
      const now = Date.now();
      
      if (!this.checkRateLimit(rateLimitKey, now)) {
        return {
          success: false,
          message: 'Rate limit exceeded for user',
        };
      }
      
      // Check deduplication
      const dedupKey = `${notificationData.fid}-${notificationData.notificationId}`;
      if (!this.checkDeduplication(dedupKey, now)) {
        return {
          success: false,
          message: 'Duplicate notification prevented',
        };
      }
      
      // Get user's notification tokens
      const tokens = getNotificationTokens(notificationData.fid);
      
      if (tokens.length === 0) {
        return {
          success: false,
          message: 'No notification tokens found for user',
        };
      }
      
      // Extract token strings
      const tokenStrings = tokens.map(t => t.token);
      
      // Send notification
      const result = await sendNotification(
        notificationData.notificationId,
        notificationData.title,
        notificationData.body,
        notificationData.targetUrl,
        tokenStrings
      );
      
      // Update rate limit
      this.updateRateLimit(rateLimitKey, now);
      
      // Update deduplication cache
      this.updateDeduplication(dedupKey, now);
      
      return {
        success: result.successfulTokens.length > 0,
        message: `Notification sent to ${result.successfulTokens.length} clients`,
        details: result,
      };
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        message: 'Failed to send notification',
        details: error,
      };
    }
  }
  
  /**
   * Send a notification to multiple users
   */
  async sendToUsers(
    notificationData: Omit<NotificationData, 'fid'>,
    fids: string[]
  ): Promise<{
    success: boolean;
    message: string;
    results: Array<{ fid: string; success: boolean; message: string }>;
  }> {
    const results = [];
    
    for (const fid of fids) {
      const result = await this.sendToUser({
        ...notificationData,
        fid,
      });
      
      results.push({
        fid,
        success: result.success,
        message: result.message,
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      message: `Sent to ${successCount}/${fids.length} users`,
      results,
    };
  }
  
  /**
   * Send focus session reminder
   */
  async sendFocusReminder(fid: string, sessionType: string = '25min'): Promise<any> {
    const now = new Date();
    const notificationId = `focus-reminder-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`;
    
    return this.sendToUser({
      notificationId,
      title: '🐉 Time to Focus!',
      body: `Ready for your ${sessionType} focus session? The dragon awaits!`,
      targetUrl: `https://dtd.rchetype.xyz?session=${sessionType}`,
      fid,
    });
  }
  
  /**
   * Send achievement notification
   */
  async sendAchievementNotification(fid: string, achievement: string): Promise<any> {
    const notificationId = `achievement-${achievement}-${Date.now()}`;
    
    return this.sendToUser({
      notificationId,
      title: '🏆 Achievement Unlocked!',
      body: `You've earned the "${achievement}" achievement! Share your victory!`,
      targetUrl: `https://dtd.rchetype.xyz?achievement=${achievement}`,
      fid,
    });
  }
  
  /**
   * Send level up notification
   */
  async sendLevelUpNotification(fid: string, level: number, character: string): Promise<any> {
    const notificationId = `level-up-${level}-${Date.now()}`;
    
    return this.sendToUser({
      notificationId,
      title: '⭐ Level Up!',
      body: `Congratulations! Your ${character} reached level ${level}!`,
      targetUrl: `https://dtd.rchetype.xyz?level=${level}&character=${character}`,
      fid,
    });
  }
  
  /**
   * Send daily challenge notification
   */
  async sendDailyChallenge(fid: string, challenge: string): Promise<any> {
    const now = new Date();
    const notificationId = `daily-challenge-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`;
    
    return this.sendToUser({
      notificationId,
      title: '⚔️ Daily Challenge!',
      body: `New challenge: ${challenge}. Can you complete it today?`,
      targetUrl: `https://dtd.rchetype.xyz?challenge=${encodeURIComponent(challenge)}`,
      fid,
    });
  }
  
  /**
   * Send streak milestone notification
   */
  async sendStreakMilestone(fid: string, streakDays: number): Promise<any> {
    const notificationId = `streak-${streakDays}-${Date.now()}`;
    
    return this.sendToUser({
      notificationId,
      title: '🔥 Streak Milestone!',
      body: `Amazing! You've maintained a ${streakDays}-day focus streak!`,
      targetUrl: `https://dtd.rchetype.xyz?streak=${streakDays}`,
      fid,
    });
  }
  
  /**
   * Check rate limit (1 notification per 30 seconds, 100 per day)
   */
  private checkRateLimit(key: string, now: number): boolean {
    const cached = rateLimitCache.get(key);
    
    if (!cached) {
      return true;
    }
    
    // Reset daily count if 24 hours have passed
    if (now > cached.resetTime) {
      return true;
    }
    
    // Check daily limit (100 notifications per day)
    if (cached.count >= 100) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Update rate limit counter
   */
  private updateRateLimit(key: string, now: number): void {
    const cached = rateLimitCache.get(key);
    const resetTime = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    if (cached && now <= cached.resetTime) {
      rateLimitCache.set(key, {
        count: cached.count + 1,
        resetTime: cached.resetTime,
      });
    } else {
      rateLimitCache.set(key, {
        count: 1,
        resetTime,
      });
    }
  }
  
  /**
   * Check deduplication (24-hour window)
   */
  private checkDeduplication(key: string, now: number): boolean {
    const cached = deduplicationCache.get(key);
    
    if (!cached) {
      return true;
    }
    
    // Check if 24 hours have passed
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - cached) > twentyFourHours;
  }
  
  /**
   * Update deduplication cache
   */
  private updateDeduplication(key: string, now: number): void {
    deduplicationCache.set(key, now);
  }
  
  /**
   * Clean up old cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Clean rate limit cache
    for (const [key, value] of rateLimitCache.entries()) {
      if (now > value.resetTime) {
        rateLimitCache.delete(key);
      }
    }
    
    // Clean deduplication cache
    for (const [key, timestamp] of deduplicationCache.entries()) {
      if ((now - timestamp) > twentyFourHours) {
        deduplicationCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

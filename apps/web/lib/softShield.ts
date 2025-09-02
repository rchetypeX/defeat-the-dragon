/**
 * Soft Shield Logic for Defeat the Dragon
 * Detects when user leaves/hides the app and manages session interruption
 * Mobile-optimized to avoid false triggers from screen timeout
 */

export interface SoftShieldConfig {
  maxAwayTime: number; // Maximum time away in seconds before session fails
  warningTime: number; // Time in seconds before showing warning
  checkInterval: number; // How often to check visibility (ms)
  awayStartDelay: number; // Delay before starting away timer (ms) - helps avoid false positives
}

export interface SoftShieldState {
  isActive: boolean;
  isDisturbed: boolean;
  awayStartTime: number | null;
  totalAwayTime: number;
  lastWarningTime: number | null;
  isMobile: boolean;
  lastUserActivity: number;
  lastVisibilityChange: number;
  isScreenTimeout: boolean; // Track if this is likely a screen timeout
}

export class SoftShield {
  private config: SoftShieldConfig;
  private state: SoftShieldState;
  private checkInterval: NodeJS.Timeout | null = null;
  private awayStartTimeout: NodeJS.Timeout | null = null;
  private onDisturbance: (awayTime: number) => void;
  private onWarning: (remainingTime: number) => void;
  private onFail: (totalAwayTime: number) => void;

  constructor(
    config: Partial<SoftShieldConfig> = {},
    callbacks: {
      onDisturbance?: (awayTime: number) => void;
      onWarning?: (remainingTime: number) => void;
      onFail?: (totalAwayTime: number) => void;
    } = {}
  ) {
    this.config = {
      maxAwayTime: 15, // 15 seconds
      warningTime: 10, // 10 seconds
      checkInterval: 1000, // Check every second
      awayStartDelay: 2000, // 2 second delay before starting away timer
      ...config,
    };

    this.state = {
      isActive: false,
      isDisturbed: false,
      awayStartTime: null,
      totalAwayTime: 0,
      lastWarningTime: null,
      isMobile: this.detectMobile(),
      lastUserActivity: Date.now(),
      lastVisibilityChange: Date.now(),
      isScreenTimeout: false,
    };

    this.onDisturbance = callbacks.onDisturbance || (() => {});
    this.onWarning = callbacks.onWarning || (() => {});
    this.onFail = callbacks.onFail || (() => {});

    this.setupVisibilityListener();
  }

  private detectMobile(): boolean {
    // Detect mobile devices more reliably
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isStandalone = (window.navigator as any).standalone === true; // iOS PWA mode
    const isInApp = /wv|FBAN|FBAV/i.test(userAgent); // WebView detection
    
    return isMobile || (isTouchDevice && isSmallScreen) || isStandalone || isInApp;
  }

  private setupVisibilityListener() {
    // Track visibility changes with timestamp
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      this.state.lastVisibilityChange = now;
      
      if (this.state.isActive) {
        if (document.hidden) {
          this.handlePageHidden();
        } else {
          this.handlePageVisible();
        }
      }
    });

    // Track user activity to help prevent false positives
    const updateActivity = () => {
      this.state.lastUserActivity = Date.now();
    };

    // Listen for user interactions
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Additional mobile-specific detection
    if (this.state.isMobile) {
      // Listen for page focus/blur events (more reliable on mobile)
      window.addEventListener('focus', () => {
        if (this.state.isActive && !document.hidden) {
          this.handlePageVisible();
        }
      });

      window.addEventListener('blur', () => {
        if (this.state.isActive && document.hidden) {
          this.handlePageHidden();
        }
      });

      // Listen for orientation changes (can indicate app switching)
      window.addEventListener('orientationchange', () => {
        // Small delay to let the change settle
        setTimeout(() => {
          if (this.state.isActive && document.hidden) {
            this.handlePageHidden();
          }
        }, 100);
      });
    }
  }

  private handlePageHidden() {
    // Clear any existing away start timeout
    if (this.awayStartTimeout) {
      clearTimeout(this.awayStartTimeout);
      this.awayStartTimeout = null;
    }

    // Check if user was recently active (within last 5 seconds)
    const timeSinceActivity = Date.now() - this.state.lastUserActivity;
    const wasRecentlyActive = timeSinceActivity < 5000;

    // Check if this might be a screen timeout (longer delay, no recent activity)
    const isLikelyScreenTimeout = !wasRecentlyActive && timeSinceActivity > 10000;
    
    if (isLikelyScreenTimeout) {
      this.state.isScreenTimeout = true;
      console.log(`SoftShield: Likely screen timeout detected (${timeSinceActivity}ms since activity)`);
      return; // Don't start away timer for screen timeouts
    }

    // Don't start away timer immediately - use a delay to avoid false positives
    // This helps with mobile screen timeout scenarios
    this.awayStartTimeout = setTimeout(() => {
      if (document.hidden && this.state.isActive && !this.state.awayStartTime && !this.state.isScreenTimeout) {
        this.state.awayStartTime = Date.now();
        console.log(`SoftShield: Page hidden for ${this.config.awayStartDelay}ms, starting away timer (mobile: ${this.state.isMobile}, wasRecentlyActive: ${wasRecentlyActive})`);
      }
    }, this.config.awayStartDelay);
  }

  private handlePageVisible() {
    // Clear the away start timeout if user returns before it triggers
    if (this.awayStartTimeout) {
      clearTimeout(this.awayStartTimeout);
      this.awayStartTimeout = null;
      console.log('SoftShield: User returned before away timer started');
    }

    // Reset screen timeout flag when user returns
    this.state.isScreenTimeout = false;

    if (this.state.awayStartTime) {
      const awayTime = Math.floor((Date.now() - this.state.awayStartTime) / 1000);
      this.state.totalAwayTime += awayTime;
      this.state.awayStartTime = null;
      
      console.log(`SoftShield: Page visible, was away for ${awayTime}s, total: ${this.state.totalAwayTime}s`);
      
      if (awayTime > 0) {
        this.state.isDisturbed = true;
        this.onDisturbance(awayTime);
      }
      
      // Reset state when user returns, regardless of warning status
      // This allows the warning to be dismissed when user returns in time
      this.state.totalAwayTime = 0;
      this.state.isDisturbed = false;
      this.state.lastWarningTime = null;
      console.log('SoftShield: User returned, resetting state and clearing warning');
    } else {
      // User returned without being away, clear disturbed state
      if (this.state.isDisturbed) {
        this.state.isDisturbed = false;
        console.log('SoftShield: User returned, clearing disturbed state');
      }
    }
  }

  private startChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      if (!this.state.isActive) return;

      const currentTime = Date.now();
      let currentAwayTime = this.state.totalAwayTime;

      // Add current away time if page is hidden and not a screen timeout
      if (this.state.awayStartTime && !this.state.isScreenTimeout) {
        currentAwayTime += Math.floor((currentTime - this.state.awayStartTime) / 1000);
      }

      // Check for warning (at exactly 10 seconds)
      if (currentAwayTime >= this.config.warningTime && 
          currentAwayTime < this.config.maxAwayTime &&
          !this.state.lastWarningTime) { // Only show warning once
        // Calculate remaining time until failure
        const remainingTime = this.config.maxAwayTime - currentAwayTime;
        this.onWarning(remainingTime);
        this.state.lastWarningTime = currentTime;
        console.log(`SoftShield: Warning triggered at ${currentAwayTime}s - ${remainingTime}s remaining until failure`);
      }

      // Continue warning countdown if warning is active
      if (this.state.lastWarningTime) {
        const timeSinceWarning = currentTime - this.state.lastWarningTime;
        const warningDuration = 1000; // 1 second intervals for countdown
        
        if (timeSinceWarning >= warningDuration) {
          // Update warning with new remaining time
          let newAwayTime = this.state.totalAwayTime;
          if (this.state.awayStartTime && !this.state.isScreenTimeout) {
            newAwayTime += Math.floor((currentTime - this.state.awayStartTime) / 1000);
          }
          
          const remainingTime = Math.max(0, this.config.maxAwayTime - newAwayTime);
          
          if (remainingTime > 0) {
            this.onWarning(remainingTime);
            this.state.lastWarningTime = currentTime; // Reset warning time for next update
            console.log(`SoftShield: Warning update - ${remainingTime}s remaining until failure`);
          } else {
            // Warning time expired, session should fail
            console.log('SoftShield: Warning time expired, session should fail');
            this.onWarning(0); // Send 0 before failing
            setTimeout(() => this.fail(), 100); // Small delay to ensure 0 is sent
          }
        }
      }

      // Check for failure (at exactly 15 seconds)
      if (currentAwayTime >= this.config.maxAwayTime && !this.state.isScreenTimeout) {
        console.log(`SoftShield: Max away time reached (${currentAwayTime}s), failing session`);
        this.fail();
      }
    }, this.config.checkInterval);
  }

  private stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Clear away start timeout
    if (this.awayStartTimeout) {
      clearTimeout(this.awayStartTimeout);
      this.awayStartTimeout = null;
    }
  }

  public start() {
    this.state.isActive = true;
    this.state.isDisturbed = false;
    this.state.awayStartTime = null;
    this.state.totalAwayTime = 0;
    this.state.lastWarningTime = null;
    this.state.lastUserActivity = Date.now();
    this.state.lastVisibilityChange = Date.now();
    this.state.isScreenTimeout = false;
    
    console.log(`SoftShield: Started (mobile: ${this.state.isMobile})`);
    this.startChecking();
  }

  public stop() {
    this.state.isActive = false;
    this.stopChecking();
    console.log('SoftShield: Stopped');
  }

  public fail() {
    if (!this.state.isActive) return;
    
    const totalAwayTime = this.state.totalAwayTime;
    this.stop();
    this.onFail(totalAwayTime);
    console.log(`SoftShield: Failed after ${totalAwayTime}s away`);
  }

  public getState(): SoftShieldState {
    return { ...this.state };
  }

  public getCurrentAwayTime(): number {
    if (!this.state.isActive) return 0;
    
    let currentAwayTime = this.state.totalAwayTime;
    
    if (this.state.awayStartTime && !this.state.isScreenTimeout) {
      currentAwayTime += Math.floor((Date.now() - this.state.awayStartTime) / 1000);
    }
    
    return currentAwayTime;
  }

  public reset() {
    this.state.totalAwayTime = 0;
    this.state.isDisturbed = false;
    this.state.lastWarningTime = null;
    this.state.isScreenTimeout = false;
  }

  public clearDisturbed() {
    this.state.isDisturbed = false;
    console.log('SoftShield: Disturbed state cleared');
  }

  public isScreenTimeout(): boolean {
    return this.state.isScreenTimeout;
  }
}

// Utility function to create a SoftShield instance
export function createSoftShield(
  config?: Partial<SoftShieldConfig>,
  callbacks?: {
    onDisturbance?: (awayTime: number) => void;
    onWarning?: (remainingTime: number) => void;
    onFail?: (totalAwayTime: number) => void;
  }
) {
  return new SoftShield(config, callbacks);
}

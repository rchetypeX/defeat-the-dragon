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
    // Only use visibilitychange event - more reliable for detecting actual app hiding
    // Don't use window.blur/focus as they can trigger on screen timeout
    document.addEventListener('visibilitychange', () => {
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

    // Don't start away timer immediately - use a delay to avoid false positives
    // This helps with mobile screen timeout scenarios
    this.awayStartTimeout = setTimeout(() => {
      if (document.hidden && this.state.isActive && !this.state.awayStartTime) {
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

      // Add current away time if page is hidden
      if (this.state.awayStartTime) {
        currentAwayTime += Math.floor((currentTime - this.state.awayStartTime) / 1000);
      }

      // Check for warning
      if (currentAwayTime >= this.config.warningTime && 
          currentAwayTime < this.config.maxAwayTime &&
          !this.state.lastWarningTime) { // Only show warning once
        // Start with exactly 5 seconds for the warning countdown
        this.onWarning(5);
        this.state.lastWarningTime = currentTime;
        console.log(`SoftShield: Warning triggered - starting 5 second countdown, current away time: ${currentAwayTime}s`);
      }

      // Continue warning countdown if warning is active
      if (this.state.lastWarningTime) {
        const timeSinceWarning = currentTime - this.state.lastWarningTime;
        const remainingTime = Math.max(0, 5000 - timeSinceWarning); // 5 second warning duration
        if (remainingTime > 0) {
          // Calculate seconds more precisely to avoid skipping numbers
          const remainingSeconds = Math.max(1, Math.ceil(remainingTime / 1000));
          console.log(`SoftShield: Countdown - timeSinceWarning: ${timeSinceWarning}ms, remainingTime: ${remainingTime}ms, remainingSeconds: ${remainingSeconds}s`);
          this.onWarning(remainingSeconds);
        } else {
          // Warning time expired, session should fail
          console.log('SoftShield: Warning time expired, session should fail');
          this.onWarning(0); // Send 0 before failing
          setTimeout(() => this.fail(), 100); // Small delay to ensure 0 is sent
        }
      }

      // Check for failure
      if (currentAwayTime >= this.config.maxAwayTime) {
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
    
    if (this.state.awayStartTime) {
      currentAwayTime += Math.floor((Date.now() - this.state.awayStartTime) / 1000);
    }
    
    return currentAwayTime;
  }

  public reset() {
    this.state.totalAwayTime = 0;
    this.state.isDisturbed = false;
    this.state.lastWarningTime = null;
  }

  public clearDisturbed() {
    this.state.isDisturbed = false;
    console.log('SoftShield: Disturbed state cleared');
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

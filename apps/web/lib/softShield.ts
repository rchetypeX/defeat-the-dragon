/**
 * Soft Shield Logic for Defeat the Dragon
 * Detects when user leaves/hides the app and manages session interruption
 */

export interface SoftShieldConfig {
  maxAwayTime: number; // Maximum time away in seconds before session fails
  warningTime: number; // Time in seconds before showing warning
  checkInterval: number; // How often to check visibility (ms)
}

export interface SoftShieldState {
  isActive: boolean;
  isDisturbed: boolean;
  awayStartTime: number | null;
  totalAwayTime: number;
  lastWarningTime: number | null;
}

export class SoftShield {
  private config: SoftShieldConfig;
  private state: SoftShieldState;
  private checkInterval: NodeJS.Timeout | null = null;
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
      ...config,
    };

    this.state = {
      isActive: false,
      isDisturbed: false,
      awayStartTime: null,
      totalAwayTime: 0,
      lastWarningTime: null,
    };

    this.onDisturbance = callbacks.onDisturbance || (() => {});
    this.onWarning = callbacks.onWarning || (() => {});
    this.onFail = callbacks.onFail || (() => {});

    this.setupVisibilityListener();
  }

  private setupVisibilityListener() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (this.state.isActive) {
        if (document.hidden) {
          this.handlePageHidden();
        } else {
          this.handlePageVisible();
        }
      }
    });

    // Handle window focus/blur
    window.addEventListener('blur', () => {
      if (this.state.isActive) {
        this.handlePageHidden();
      }
    });

    window.addEventListener('focus', () => {
      if (this.state.isActive) {
        this.handlePageVisible();
      }
    });
  }

  private handlePageHidden() {
    if (!this.state.awayStartTime) {
      this.state.awayStartTime = Date.now();
      console.log('SoftShield: Page hidden, starting away timer');
    }
  }

  private handlePageVisible() {
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
  }

  public start() {
    this.state.isActive = true;
    this.state.isDisturbed = false;
    this.state.awayStartTime = null;
    this.state.totalAwayTime = 0;
    this.state.lastWarningTime = null;
    
    console.log('SoftShield: Started');
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

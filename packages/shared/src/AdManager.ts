/**
 * AdManager.ts - Universal HTML5 Game Ad Wrapper for CrazyGames SDK v3 & Portals
 * Handles dynamic script injection, environment detection, and automatic 2-second mock ad fallback.
 */

import { soundEngine } from './SoundEngine';

// Global CrazyGames SDK typing
declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        init: () => Promise<void>;
        ad?: {
          requestAd: (
            type: 'midgame' | 'rewarded',
            callbacks?: {
              beforeAd?: () => void;
              afterAd?: () => void;
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: unknown) => void;
            }
          ) => Promise<void>;
        };
        game?: {
          gameplayStart: () => void;
          gameplayStop: () => void;
          happyTime: () => void;
        };
      };
    };
  }
}

export type AdCallback = () => void;

export interface AdManagerOptions {
  autoInit?: boolean;
  onPauseGame?: () => void;
  onResumeGame?: () => void;
}

export class AdManager {
  private static instance: AdManager | null = null;
  private isInitialized = false;
  private sdkAvailable = false;
  private onPauseGame?: () => void;
  private onResumeGame?: () => void;
  private isShowingAd = false;

  constructor(options?: AdManagerOptions) {
    if (typeof window !== 'undefined') {
      (window as any).adManager = this;
    }
    if (options?.onPauseGame) this.onPauseGame = options.onPauseGame;
    if (options?.onResumeGame) this.onResumeGame = options.onResumeGame;

    if (options?.autoInit !== false) {
      this.init().catch(() => {
        // Safe silent fail - fallback will be used
      });
    }
  }

  public static getInstance(options?: AdManagerOptions): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager(options);
    }
    return AdManager.instance;
  }

  /**
   * Set game pause / resume hooks
   */
  public setGameHooks(onPause: () => void, onResume: () => void): void {
    this.onPauseGame = onPause;
    this.onResumeGame = onResume;
  }

  /**
   * Detect if running locally or outside supported iframe portals
   */
  public isLocalOrStandalone(): boolean {
    if (typeof window === 'undefined') return true;
    const { hostname, protocol } = window.location;
    return (
      protocol === 'file:' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    );
  }

  /**
   * Dynamically loads CrazyGames SDK v3 script if not present
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // In local dev, skip network script load to guarantee instant zero-error fallback
    if (this.isLocalOrStandalone()) {
      this.sdkAvailable = false;
      return;
    }

    try {
      if (!window.CrazyGames?.SDK) {
        await this.injectScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
      }

      if (window.CrazyGames?.SDK) {
        await window.CrazyGames.SDK.init();
        this.sdkAvailable = true;
      }
    } catch {
      // uBlock Origin, offline, or portal sandbox blocking script
      this.sdkAvailable = false;
    }
  }

  /**
   * Shows an interstitial (midgame) ad.
   */
  public async showInterstitial(): Promise<boolean> {
    if (this.isShowingAd) return false;
    this.isShowingAd = true;
    this.triggerPause();

    try {
      if (this.sdkAvailable && window.CrazyGames?.SDK?.ad) {
        let finished = false;
        await window.CrazyGames.SDK.ad.requestAd('midgame', {
          adStarted: () => {
            // Already paused
          },
          adFinished: () => {
            finished = true;
          },
          adError: () => {
            finished = false;
          }
        });
        return finished;
      } else {
        // Fallback for localhost or outside portal
        await this.showMockAdOverlay('Ad playing... 2s', 'INTERSTITIAL AD');
        return true;
      }
    } catch {
      return false;
    } finally {
      this.isShowingAd = false;
      this.triggerResume();
    }
  }

  /**
   * Shows a rewarded ad. If completed, triggers onReward callback.
   */
  public async showRewarded(onReward: () => void): Promise<boolean> {
    if (this.isShowingAd) return false;
    this.isShowingAd = true;
    this.triggerPause();

    let rewarded = false;

    try {
      if (this.sdkAvailable && window.CrazyGames?.SDK?.ad) {
        await window.CrazyGames.SDK.ad.requestAd('rewarded', {
          adStarted: () => {
            // Paused
          },
          adFinished: () => {
            rewarded = true;
            try {
              onReward();
            } catch (err) {
              console.error('[AdManager] Error in onReward callback:', err);
            }
          },
          adError: () => {
            rewarded = false;
          }
        });
        return rewarded;
      } else {
        // Fallback for localhost or standalone
        await this.showMockAdOverlay('Ad playing... 2s', 'REWARDED AD (TEST MODE)');
        rewarded = true;
        try {
          onReward();
        } catch (err) {
          console.error('[AdManager] Error in onReward callback:', err);
        }
        return true;
      }
    } catch {
      return false;
    } finally {
      this.isShowingAd = false;
      this.triggerResume();
    }
  }

  private triggerPause(): void {
    try {
      soundEngine.setMuted(true);
    } catch {
      // Ignore sound error
    }
    try {
      this.onPauseGame?.();
    } catch {
      // Ignore hook error
    }
  }

  private triggerResume(): void {
    try {
      this.onResumeGame?.();
    } catch {
      // Ignore hook error
    }
  }

  /**
   * Dispatches CrazyGames gameplayStart event.
   * Call when active gameplay begins (after menu, level start, revival).
   */
  public gameplayStart(): void {
    try {
      if (this.sdkAvailable && window.CrazyGames?.SDK?.game?.gameplayStart) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
      if (typeof window !== 'undefined') {
        (window as any).__lastAdEvent = 'gameplayStart';
        window.dispatchEvent(new CustomEvent('crazygames:gameplayStart'));
      }
      console.log('[AdManager] gameplayStart dispatched');
    } catch (err) {
      console.warn('[AdManager] gameplayStart error:', err);
    }
  }

  /**
   * Dispatches CrazyGames gameplayStop event.
   * Call when gameplay pauses or stops (game over, pause modal, main menu).
   */
  public gameplayStop(): void {
    try {
      if (this.sdkAvailable && window.CrazyGames?.SDK?.game?.gameplayStop) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
      if (typeof window !== 'undefined') {
        (window as any).__lastAdEvent = 'gameplayStop';
        window.dispatchEvent(new CustomEvent('crazygames:gameplayStop'));
      }
      console.log('[AdManager] gameplayStop dispatched');
    } catch (err) {
      console.warn('[AdManager] gameplayStop error:', err);
    }
  }

  /**
   * Dispatches CrazyGames happyTime event.
   * Call when player achieves a milestone (boss defeat, high combo, level win).
   */
  public happyTime(): void {
    try {
      if (this.sdkAvailable && window.CrazyGames?.SDK?.game?.happyTime) {
        window.CrazyGames.SDK.game.happyTime();
      }
      if (typeof window !== 'undefined') {
        (window as any).__lastAdEvent = 'happyTime';
        window.dispatchEvent(new CustomEvent('crazygames:happyTime'));
      }
      console.log('[AdManager] happyTime dispatched');
    } catch (err) {
      console.warn('[AdManager] happyTime error:', err);
    }
  }

  /**
   * Visual mock ad overlay displayed for 2 seconds when running on localhost or outside portal.
   */
  private showMockAdOverlay(message: string, tag: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const overlay = document.createElement('div');
      overlay.id = 'arcade-mock-ad-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: rgba(10, 10, 18, 0.94);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
        padding: 20px;
        box-sizing: border-box;
        backdrop-filter: blur(8px);
        user-select: none;
        -webkit-user-select: none;
      `;

      const card = document.createElement('div');
      card.style.cssText = `
        background: linear-gradient(145deg, #181926, #24273a);
        border: 2px solid #00f0ff;
        box-shadow: 0 0 30px rgba(0, 240, 255, 0.35);
        border-radius: 16px;
        padding: 32px 40px;
        max-width: 420px;
        width: 90%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      `;

      const tagEl = document.createElement('div');
      tagEl.style.cssText = `
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #ff007f;
        background: rgba(255, 0, 127, 0.15);
        padding: 4px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 0, 127, 0.4);
      `;
      tagEl.textContent = tag;

      const titleEl = document.createElement('div');
      titleEl.id = 'arcade-mock-ad-text';
      titleEl.style.cssText = `
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 0.5px;
      `;
      titleEl.textContent = message;

      const subEl = document.createElement('div');
      subEl.style.cssText = `
        font-size: 13px;
        color: #a6adc8;
      `;
      subEl.textContent = 'Simulating commercial ad display (Localhost / Test)';

      const progressContainer = document.createElement('div');
      progressContainer.style.cssText = `
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        overflow: hidden;
        margin-top: 8px;
      `;

      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #00f0ff, #ff007f);
        transition: width 0.1s linear;
      `;
      progressContainer.appendChild(progressBar);

      card.appendChild(tagEl);
      card.appendChild(titleEl);
      card.appendChild(subEl);
      card.appendChild(progressContainer);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const totalDuration = 2000;
      const startTime = performance.now();

      const timer = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / totalDuration);
        const remainingSeconds = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));

        progressBar.style.width = `${progress * 100}%`;
        titleEl.textContent = `Ad playing... ${remainingSeconds}s`;

        if (elapsed >= totalDuration) {
          clearInterval(timer);
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          resolve();
        }
      }, 50);
    });
  }

  private injectScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }
}

// Export singleton helper
export const adManager = AdManager.getInstance();

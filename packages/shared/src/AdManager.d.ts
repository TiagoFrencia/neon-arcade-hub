/**
 * AdManager.ts - Universal HTML5 Game Ad Wrapper for CrazyGames SDK v3 & Portals
 * Handles dynamic script injection, environment detection, and automatic 2-second mock ad fallback.
 */
declare global {
    interface Window {
        CrazyGames?: {
            SDK?: {
                init: () => Promise<void>;
                ad?: {
                    requestAd: (type: 'midgame' | 'rewarded', callbacks?: {
                        beforeAd?: () => void;
                        afterAd?: () => void;
                        adStarted?: () => void;
                        adFinished?: () => void;
                        adError?: (error: unknown) => void;
                    }) => Promise<void>;
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
export declare class AdManager {
    private static instance;
    private isInitialized;
    private sdkAvailable;
    private onPauseGame?;
    private onResumeGame?;
    private isShowingAd;
    constructor(options?: AdManagerOptions);
    static getInstance(options?: AdManagerOptions): AdManager;
    /**
     * Set game pause / resume hooks
     */
    setGameHooks(onPause: () => void, onResume: () => void): void;
    /**
     * Detect if running locally or outside supported iframe portals
     */
    isLocalOrStandalone(): boolean;
    /**
     * Dynamically loads CrazyGames SDK v3 script if not present
     */
    init(): Promise<void>;
    /**
     * Shows an interstitial (midgame) ad.
     */
    showInterstitial(): Promise<boolean>;
    /**
     * Shows a rewarded ad. If completed, triggers onReward callback.
     */
    showRewarded(onReward: () => void): Promise<boolean>;
    private triggerPause;
    private triggerResume;
    /**
     * Visual mock ad overlay displayed for 2 seconds when running on localhost or outside portal.
     */
    private showMockAdOverlay;
    private injectScript;
}
export declare const adManager: AdManager;

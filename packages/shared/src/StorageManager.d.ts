/**
 * StorageManager.ts - Safe localStorage Wrapper with In-Memory Fallback
 * Works seamlessly inside sandboxed iframes (CrazyGames, Poki, Itch.io) even when cookies/storage are blocked.
 */
export declare class StorageManager {
    private prefix;
    private memoryFallback;
    private isLocalStorageAvailable;
    constructor(gameId?: string);
    /**
     * Factory method to create a game-scoped storage manager
     */
    static forGame(gameId: string): StorageManager;
    private checkLocalStorage;
    private getFullKey;
    isUsingMemory(): boolean;
    getItem<T>(key: string, defaultValue: T): T;
    setItem<T>(key: string, value: T): void;
    removeItem(key: string): void;
    clear(): void;
    getHighScore(mode?: string): number;
    /**
     * Sets high score if new score is higher. Returns true if a new high score was set.
     */
    setHighScore(score: number, mode?: string): boolean;
    getCoins(): number;
    setCoins(coins: number): void;
    addCoins(amount: number): number;
    getUpgrades<T = Record<string, number>>(defaultUpgrades?: T): T;
    setUpgrades<T = Record<string, number>>(upgrades: T): void;
}

/**
 * StorageManager.ts - Safe localStorage Wrapper with In-Memory Fallback
 * Works seamlessly inside sandboxed iframes (CrazyGames, Poki, Itch.io) even when cookies/storage are blocked.
 */

export class StorageManager {
  private prefix: string;
  private memoryFallback: Map<string, string> = new Map();
  private isLocalStorageAvailable: boolean;

  constructor(gameId = 'arcade_game') {
    this.prefix = `${gameId}_`;
    this.isLocalStorageAvailable = this.checkLocalStorage();
  }

  /**
   * Factory method to create a game-scoped storage manager
   */
  public static forGame(gameId: string): StorageManager {
    return new StorageManager(gameId);
  }

  private checkLocalStorage(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const testKey = `__storage_test_${Date.now()}`;
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  public isUsingMemory(): boolean {
    return !this.isLocalStorageAvailable;
  }

  public getItem<T>(key: string, defaultValue: T): T {
    const fullKey = this.getFullKey(key);
    let rawValue: string | null = null;

    if (this.isLocalStorageAvailable) {
      try {
        rawValue = window.localStorage.getItem(fullKey);
      } catch {
        rawValue = this.memoryFallback.get(fullKey) ?? null;
      }
    } else {
      rawValue = this.memoryFallback.get(fullKey) ?? null;
    }

    if (rawValue === null || rawValue === undefined) {
      return defaultValue;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return defaultValue;
    }
  }

  public setItem<T>(key: string, value: T): void {
    const fullKey = this.getFullKey(key);
    const serialized = JSON.stringify(value);

    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(fullKey, serialized);
        return;
      } catch {
        // QuotaExceededError or sandboxed iframe restriction triggered after init
        this.isLocalStorageAvailable = false;
      }
    }

    this.memoryFallback.set(fullKey, serialized);
  }

  public removeItem(key: string): void {
    const fullKey = this.getFullKey(key);

    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(fullKey);
      } catch {
        // Safe ignore
      }
    }
    this.memoryFallback.delete(fullKey);
  }

  public clear(): void {
    if (this.isLocalStorageAvailable) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      } catch {
        // Safe ignore
      }
    }
    this.memoryFallback.clear();
  }

  // --- Convenience Arcade Methods ---

  public getHighScore(mode = 'standard'): number {
    return this.getItem<number>(`highscore_${mode}`, 0);
  }

  /**
   * Sets high score if new score is higher. Returns true if a new high score was set.
   */
  public setHighScore(score: number, mode = 'standard'): boolean {
    const current = this.getHighScore(mode);
    if (score > current) {
      this.setItem<number>(`highscore_${mode}`, score);
      return true;
    }
    return false;
  }

  public getCoins(): number {
    return this.getItem<number>('coins', 0);
  }

  public setCoins(coins: number): void {
    this.setItem<number>('coins', Math.max(0, Math.floor(coins)));
  }

  public addCoins(amount: number): number {
    const updated = Math.max(0, this.getCoins() + Math.floor(amount));
    this.setCoins(updated);
    return updated;
  }

  public getUpgrades<T = Record<string, number>>(defaultUpgrades: T = {} as T): T {
    return this.getItem<T>('upgrades', defaultUpgrades);
  }

  public setUpgrades<T = Record<string, number>>(upgrades: T): void {
    this.setItem<T>('upgrades', upgrades);
  }
}

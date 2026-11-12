/**
 * StorageManager.ts - Safe localStorage Wrapper with In-Memory Fallback
 * Works seamlessly inside sandboxed iframes (CrazyGames, Poki, Itch.io) even when cookies/storage are blocked.
 */
export class StorageManager {
    prefix;
    memoryFallback = new Map();
    isLocalStorageAvailable;
    constructor(gameId = 'arcade_game') {
        this.prefix = `${gameId}_`;
        this.isLocalStorageAvailable = this.checkLocalStorage();
    }
    /**
     * Factory method to create a game-scoped storage manager
     */
    static forGame(gameId) {
        return new StorageManager(gameId);
    }
    checkLocalStorage() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return false;
        }
        try {
            const testKey = `__storage_test_${Date.now()}`;
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return true;
        }
        catch {
            return false;
        }
    }
    getFullKey(key) {
        return `${this.prefix}${key}`;
    }
    isUsingMemory() {
        return !this.isLocalStorageAvailable;
    }
    getItem(key, defaultValue) {
        const fullKey = this.getFullKey(key);
        let rawValue = null;
        if (this.isLocalStorageAvailable) {
            try {
                rawValue = window.localStorage.getItem(fullKey);
            }
            catch {
                rawValue = this.memoryFallback.get(fullKey) ?? null;
            }
        }
        else {
            rawValue = this.memoryFallback.get(fullKey) ?? null;
        }
        if (rawValue === null || rawValue === undefined) {
            return defaultValue;
        }
        try {
            return JSON.parse(rawValue);
        }
        catch {
            return defaultValue;
        }
    }
    setItem(key, value) {
        const fullKey = this.getFullKey(key);
        const serialized = JSON.stringify(value);
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(fullKey, serialized);
                return;
            }
            catch {
                // QuotaExceededError or sandboxed iframe restriction triggered after init
                this.isLocalStorageAvailable = false;
            }
        }
        this.memoryFallback.set(fullKey, serialized);
    }
    removeItem(key) {
        const fullKey = this.getFullKey(key);
        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.removeItem(fullKey);
            }
            catch {
                // Safe ignore
            }
        }
        this.memoryFallback.delete(fullKey);
    }
    clear() {
        if (this.isLocalStorageAvailable) {
            try {
                const keysToRemove = [];
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach((key) => window.localStorage.removeItem(key));
            }
            catch {
                // Safe ignore
            }
        }
        this.memoryFallback.clear();
    }
    // --- Convenience Arcade Methods ---
    getHighScore(mode = 'standard') {
        return this.getItem(`highscore_${mode}`, 0);
    }
    /**
     * Sets high score if new score is higher. Returns true if a new high score was set.
     */
    setHighScore(score, mode = 'standard') {
        const current = this.getHighScore(mode);
        if (score > current) {
            this.setItem(`highscore_${mode}`, score);
            return true;
        }
        return false;
    }
    getCoins() {
        return this.getItem('coins', 0);
    }
    setCoins(coins) {
        this.setItem('coins', Math.max(0, Math.floor(coins)));
    }
    addCoins(amount) {
        const updated = Math.max(0, this.getCoins() + Math.floor(amount));
        this.setCoins(updated);
        return updated;
    }
    getUpgrades(defaultUpgrades = {}) {
        return this.getItem('upgrades', defaultUpgrades);
    }
    setUpgrades(upgrades) {
        this.setItem('upgrades', upgrades);
    }
}

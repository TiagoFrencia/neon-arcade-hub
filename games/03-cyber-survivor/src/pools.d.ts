import { Enemy, EnemyType, GemType, Projectile, XPGem } from './types';
export declare class EnemyPool {
    private pool;
    private activeList;
    constructor(size?: number);
    spawn(type: EnemyType, x: number, y: number, options?: {
        hpMultiplier?: number;
        speedMultiplier?: number;
        splitCount?: number;
    }): Enemy | null;
    release(enemy: Enemy): void;
    getActives(): Enemy[];
    clear(): void;
}
export declare class ProjectilePool {
    private pool;
    private activeList;
    constructor(size?: number);
    spawn(x: number, y: number, vx: number, vy: number, damage: number, radius?: number, color?: string, maxLife?: number, pierce?: number): Projectile | null;
    release(proj: Projectile): void;
    getActives(): Projectile[];
    clear(): void;
}
export declare class GemPool {
    private pool;
    private activeList;
    constructor(size?: number);
    spawn(x: number, y: number, type: GemType, value: number): XPGem | null;
    release(gem: XPGem): void;
    getActives(): XPGem[];
    clear(): void;
}

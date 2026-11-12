import { EnemyPool, ProjectilePool } from './pools';
import { Enemy, LaserBeam, LightningStrike, NovaWave, Player } from './types';
export declare class WeaponManager {
    private plasmaCooldown;
    private chainLightningCooldown;
    private laserCooldown;
    private novaCooldown;
    private orbitalAngle;
    activeLightnings: LightningStrike[];
    activeLasers: LaserBeam[];
    activeNovas: NovaWave[];
    damageMultiplier: number;
    cooldownMultiplier: number;
    constructor();
    update(dt: number, player: Player, enemyPool: EnemyPool, projectilePool: ProjectilePool, onEnemyDamaged: (enemy: Enemy, damage: number, isCrit?: boolean) => void): void;
    /**
     * Weapon 1: Plasma Bolt (Direct homing / targeted projectile)
     */
    private firePlasmaBolt;
    /**
     * Weapon 2: Orbital Shields (Energy orbs rotating around player)
     */
    private updateOrbitalShields;
    /**
     * Weapon 3: Chain Lightning (Electric arc jumping across 2-5 enemies)
     */
    private fireChainLightning;
    /**
     * Weapon 4: Laser Beam (Continuous piercing beam across screen)
     */
    private fireLaserBeam;
    /**
     * Weapon 5: Nova Pulse (Expanding circular shockwave)
     */
    private fireNovaPulse;
    /**
     * Update transient visual effects, test continuous collision, decay timers
     */
    private updateTransientEffects;
    getOrbitalShieldPositions(player: Player, level: number): {
        x: number;
        y: number;
    }[];
    reset(): void;
}

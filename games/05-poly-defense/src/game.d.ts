import { Enemy, GridSlot, Projectile, TurretType, WaveConfig } from './types';
export interface GameEventCallbacks {
    onSoundLaser: () => void;
    onSoundExplosion: () => void;
    onSoundPop: () => void;
    onSoundCrunch: () => void;
    onSoundMerge: (pitch: number) => void;
    onSoundLevelUp: () => void;
    onSoundGameOver: () => void;
    onSoundClick: () => void;
    onSpawnParticles: (x: number, y: number, color: string, count?: number, speed?: number) => void;
    onFloatingText: (x: number, y: number, text: string, color?: string, size?: number) => void;
    onCameraShake: (intensity: number, duration?: number) => void;
}
export declare class PolyDefenseGame {
    slots: GridSlot[];
    enemies: Enemy[];
    projectiles: Projectile[];
    gold: number;
    spawnCost: number;
    spawnCount: number;
    baseHp: number;
    currentWave: number;
    score: number;
    totalKills: number;
    doubleBoostWavesLeft: number;
    isFreezeActive: boolean;
    freezeTimer: number;
    waveEnemiesRemainingToSpawn: number;
    spawnTimer: number;
    currentWaveConfig: WaveConfig | null;
    isWaveInProgress: boolean;
    waveBreakTimer: number;
    private callbacks;
    constructor(callbacks: GameEventCallbacks);
    private initGrid;
    getEmptySlots(): GridSlot[];
    getOccupiedSlots(): GridSlot[];
    getAverageTurretLevel(): number;
    /**
     * Spawns a Level 1 turret in a random empty slot with gold deduction
     */
    spawnTurretWithGold(): boolean;
    /**
     * Places a turret in a given slot
     */
    placeTurret(slotIndex: number, type: TurretType, level: number): void;
    /**
     * Executes Merge or Move between two slots
     */
    handleTurretDrop(sourceIndex: number, targetIndex: number): boolean;
    /**
     * Rewarded Ad 1: AirDrop Crate
     * Fills up to 3 empty slots with free turrets of current average level
     */
    triggerAirDropReward(): number;
    /**
     * Rewarded Ad 2: 2X Speed & Double Gold for 3 full waves
     */
    triggerDoubleBoostReward(): void;
    /**
     * Rewarded Ad 3: Repair Base + Freeze Enemies
     */
    triggerRepairAndFreezeReward(): void;
    /**
     * Wave management
     */
    startWave(waveNumber: number): void;
    private spawnWaveEnemy;
    /**
     * Main game physics, targeting, and combat update
     */
    update(dt: number): void;
    private updateWaveSpawner;
    private updateEnemies;
    private updateTurrets;
    private acquireTargetForTurret;
    private fireTurret;
    private updateProjectiles;
    private applyProjectileHit;
    private damageEnemy;
    private killEnemy;
}

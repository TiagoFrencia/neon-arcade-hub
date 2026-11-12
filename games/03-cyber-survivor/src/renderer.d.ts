import { ParticleSystem } from '@arcade/shared';
import { Enemy, Player, Projectile, VirtualJoystick, XPGem } from './types';
import { WeaponManager } from './weapons';
export declare class CyberRenderer {
    private ctx;
    private cyberDust;
    constructor(ctx: CanvasRenderingContext2D);
    render(player: Player, camera: {
        x: number;
        y: number;
    }, enemies: Enemy[], projectiles: Projectile[], gems: XPGem[], weapons: WeaponManager, particles: ParticleSystem, joystick: VirtualJoystick, timeAlive: number): void;
    /**
     * Infinite Cybernetic Grid with horizon glow and coordinates
     */
    private drawCyberGrid;
    /**
     * Draw Player Geometric Ship / Core
     */
    private drawPlayer;
    /**
     * Draw Enemies with geometric forms & hit-flashes
     */
    private drawEnemies;
    /**
     * Draw XP Gems with magnetic trails
     */
    private drawGems;
    /**
     * Draw Projectiles with motion glows
     */
    private drawProjectiles;
    /**
     * Draw Weapons Effects (Orbital Shields, Laser Beams, Chain Lightning, Nova Shockwaves)
     */
    private drawWeaponEffects;
    /**
     * Draw On-Screen Virtual Joystick when touch/mouse drag active
     */
    private drawVirtualJoystick;
}

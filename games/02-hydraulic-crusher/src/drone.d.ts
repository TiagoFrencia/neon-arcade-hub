/**
 * drone.ts - Golden Drone event manager (spawns every 90 seconds)
 */
export interface DroneState {
    active: boolean;
    intercepted: boolean;
    x: number;
    y: number;
    baseY: number;
    speed: number;
    direction: number;
    timeAlive: number;
    rotorAngle: number;
    bounty: number;
}
export declare class GoldenDroneManager {
    private timer;
    private readonly cooldown;
    drone: DroneState | null;
    constructor();
    getTimerRemaining(): number;
    isDroneActive(): boolean;
    update(dt: number, currentEstimatedEps: number, currentCoins: number): void;
    /**
     * Spawns the golden drone with scaled bounty
     */
    spawnDrone(currentEstimatedEps: number, currentCoins: number): void;
    /**
     * Tests if a tap coordinate hits the golden drone
     */
    checkHit(tapX: number, tapY: number): boolean;
    dismissDrone(): void;
    despawnDrone(): void;
}

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
  direction: number; // 1 = right, -1 = left
  timeAlive: number;
  rotorAngle: number;
  bounty: number;
}

export class GoldenDroneManager {
  private timer = 90; // 90 seconds cooldown
  private readonly cooldown = 90;
  public drone: DroneState | null = null;

  constructor() {
    // Initial spawn timer (first drone arrives around 60s for great pacing)
    this.timer = 60;
  }

  public getTimerRemaining(): number {
    return Math.max(0, this.timer);
  }

  public isDroneActive(): boolean {
    return this.drone !== null && this.drone.active;
  }

  public update(dt: number, currentEstimatedEps: number, currentCoins: number): void {
    if (!this.drone) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.spawnDrone(currentEstimatedEps, currentCoins);
      }
      return;
    }

    const d = this.drone;
    d.rotorAngle += dt * 35;
    d.timeAlive += dt;

    if (!d.intercepted) {
      // Bobbing sine motion
      d.y = d.baseY + Math.sin(d.timeAlive * 3.5) * 14;
      d.x += d.speed * d.direction * dt;

      // Offscreen exit check
      if ((d.direction === 1 && d.x > 530) || (d.direction === -1 && d.x < -50)) {
        this.despawnDrone();
      }
    }
  }

  /**
   * Spawns the golden drone with scaled bounty
   */
  public spawnDrone(currentEstimatedEps: number, currentCoins: number): void {
    // Direction: random left to right or right to left
    const dir = Math.random() < 0.5 ? 1 : -1;
    const startX = dir === 1 ? -45 : 525;
    const baseY = 190 + Math.random() * 40;

    // Scale giant coin bounty: at least 3 minutes worth of earnings or ~30% of current wealth
    const minBounty = 200;
    const timeBasedBounty = Math.round(Math.max(1, currentEstimatedEps) * 180);
    const wealthBounty = Math.round(currentCoins * 0.35);
    const bounty = Math.max(minBounty, Math.max(timeBasedBounty, wealthBounty));

    this.drone = {
      active: true,
      intercepted: false,
      x: startX,
      y: baseY,
      baseY,
      speed: 75,
      direction: dir,
      timeAlive: 0,
      rotorAngle: 0,
      bounty
    };
  }

  /**
   * Tests if a tap coordinate hits the golden drone
   */
  public checkHit(tapX: number, tapY: number): boolean {
    if (!this.drone || !this.drone.active || this.drone.intercepted) return false;

    const dx = tapX - this.drone.x;
    const dy = tapY - this.drone.y;
    const hitRadius = 45;

    if (dx * dx + dy * dy < hitRadius * hitRadius) {
      this.drone.intercepted = true;
      return true;
    }

    return false;
  }

  public dismissDrone(): void {
    if (this.drone) {
      // Fly away rapidly
      this.drone.speed = 350;
      this.drone.intercepted = false;
      setTimeout(() => this.despawnDrone(), 400);
    }
  }

  public despawnDrone(): void {
    this.drone = null;
    this.timer = this.cooldown;
  }
}

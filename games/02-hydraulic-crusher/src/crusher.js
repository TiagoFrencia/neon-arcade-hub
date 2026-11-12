/**
 * crusher.ts - Physical simulation of dual toothed rollers, voxel objects, and debris funnel
 */
import { ALL_BLUEPRINTS } from './blueprints';
export class CrusherSimulation {
    // Arena bounds
    width = 480;
    height = 800;
    // Rollers configuration
    leftRoller;
    rightRoller;
    // Falling object state
    currentObject = null;
    nextObjectTimer = 0;
    // Debris in funnel
    debrisList = [];
    // Funnel geometry
    funnelYStart = 470;
    funnelYEnd = 580;
    funnelLeftX1 = 60;
    funnelLeftX2 = 205;
    funnelRightX1 = 420;
    funnelRightX2 = 275;
    // Stats / Events for this frame
    pendingCrushEvents = [];
    pendingCashEvents = [];
    hasCrushOccurred = false;
    hasSlamOccurred = false;
    hasCompletedObject = false;
    // Hydraulic Slam effect tracking
    slamProgress = 1.0; // 0 = start of slam animation, 1 = idle
    slamX = 240;
    slamY = 280;
    // Multipliers
    overdriveActive = false;
    overdriveRemaining = 0;
    constructor() {
        const rollerY = 375;
        const rollerRadius = 70;
        this.leftRoller = {
            x: 160,
            y: rollerY,
            radius: rollerRadius,
            angle: 0,
            teethCount: 8,
            toothLength: 22,
            toothWidth: 14,
            rotationSpeed: 2.6,
            direction: 1 // Clockwise (downward at center pinch)
        };
        this.rightRoller = {
            x: 320,
            y: rollerY,
            radius: rollerRadius,
            angle: Math.PI / 8, // Offset by half pitch for teeth meshing
            teethCount: 8,
            toothLength: 22,
            toothWidth: 14,
            rotationSpeed: 2.6,
            direction: -1 // Counter-clockwise (downward at center pinch)
        };
        // Spawn first object
        this.spawnObject(1);
    }
    /**
     * Spawns a new object based on unlocked tier
     */
    spawnObject(maxUnlockedTier) {
        // Filter available blueprints up to unlocked tier
        const available = ALL_BLUEPRINTS.filter((bp) => bp.tier <= Math.max(1, maxUnlockedTier));
        // Pick with slight weight towards higher tiers
        const randomIndex = Math.floor(Math.pow(Math.random(), 0.7) * available.length);
        const blueprint = available[Math.min(randomIndex, available.length - 1)];
        const voxels = [];
        const grid = blueprint.grid;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                const val = grid[r][c];
                if (val > 0) {
                    const color = blueprint.palette[val] || '#00f0ff';
                    voxels.push({
                        gx: c,
                        gy: r,
                        color,
                        edgeColor: '#ffffff',
                        hp: blueprint.baseHp,
                        maxHp: blueprint.baseHp,
                        value: blueprint.baseValue
                    });
                }
            }
        }
        this.currentObject = {
            blueprint,
            x: 240,
            y: 90,
            vx: 0,
            vy: 60,
            voxels,
            totalVoxels: voxels.length,
            destroyedVoxels: 0,
            isComplete: false,
            spawnTime: performance.now()
        };
    }
    /**
     * Updates upgrades parameters into simulation mechanics
     */
    applyUpgrades(upgrades) {
        // 1. Power (damage per tick/hit)
        // 2. Speed (RPM)
        const baseRpm = 2.4 + (upgrades.speed - 1) * 0.55;
        const speedMult = this.overdriveActive ? 3.0 : 1.0;
        this.leftRoller.rotationSpeed = baseRpm * speedMult;
        this.rightRoller.rotationSpeed = baseRpm * speedMult;
        // 3. Teeth size and count
        const teeth = Math.min(20, 6 + (upgrades.teeth - 1) * 2);
        this.leftRoller.teethCount = teeth;
        this.rightRoller.teethCount = teeth;
        this.leftRoller.toothLength = 20 + Math.min(10, (upgrades.teeth - 1) * 1.2);
        this.rightRoller.toothLength = this.leftRoller.toothLength;
    }
    /**
     * Main simulation tick
     */
    update(dt, upgrades) {
        const clampedDt = Math.min(dt, 0.05);
        // Reset frame events
        this.pendingCrushEvents.length = 0;
        this.pendingCashEvents.length = 0;
        this.hasCrushOccurred = false;
        this.hasSlamOccurred = false;
        this.hasCompletedObject = false;
        // Update overdrive timer
        if (this.overdriveActive) {
            this.overdriveRemaining -= clampedDt;
            if (this.overdriveRemaining <= 0) {
                this.overdriveActive = false;
                this.overdriveRemaining = 0;
            }
        }
        // Apply upgrades & speed
        this.applyUpgrades(upgrades);
        // Rotate rollers
        this.leftRoller.angle += this.leftRoller.rotationSpeed * this.leftRoller.direction * clampedDt;
        this.rightRoller.angle += this.rightRoller.rotationSpeed * this.rightRoller.direction * clampedDt;
        // Keep angles in [0, 2PI)
        this.leftRoller.angle = (this.leftRoller.angle + Math.PI * 100) % (Math.PI * 2);
        this.rightRoller.angle = (this.rightRoller.angle + Math.PI * 100) % (Math.PI * 2);
        // Update slam animation
        if (this.slamProgress < 1.0) {
            this.slamProgress = Math.min(1.0, this.slamProgress + clampedDt * 4.5);
        }
        // Update falling object
        if (this.currentObject && !this.currentObject.isComplete) {
            this.updateObjectPhysics(clampedDt, upgrades);
        }
        else {
            // Spawn countdown for next object
            this.nextObjectTimer -= clampedDt;
            if (this.nextObjectTimer <= 0) {
                this.spawnObject(upgrades.objectTier);
            }
        }
        // Update debris falling in the funnel
        this.updateDebrisPhysics(clampedDt);
    }
    /**
     * Updates physics and crushing on the falling voxel object
     */
    updateObjectPhysics(dt, upgrades) {
        const obj = this.currentObject;
        const bp = obj.blueprint;
        const vSize = bp.voxelSize;
        // Calculate bounding box of remaining voxels
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < obj.voxels.length; i++) {
            const vy = obj.y + (obj.voxels[i].gy - bp.height / 2) * vSize;
            if (vy < minY)
                minY = vy;
            if (vy > maxY)
                maxY = vy;
        }
        // Contact threshold with rollers
        const crusherTop = this.leftRoller.y - this.leftRoller.radius - this.leftRoller.toothLength;
        const pinchY = this.leftRoller.y;
        if (maxY < crusherTop) {
            // Free falling under chute gravity
            obj.vy += 380 * dt;
            obj.y += obj.vy * dt;
            // Slight guide centering
            obj.x += (240 - obj.x) * dt * 4;
        }
        else {
            // In contact with crusher zone
            // Traction from inward rollers pulls object down
            const feedSpeed = (28 + (upgrades.speed - 1) * 6) * (this.overdriveActive ? 2.5 : 1.0);
            obj.vy = feedSpeed;
            obj.y += obj.vy * dt;
            obj.x += (240 - obj.x) * dt * 6;
            // Check tooth collisions and crush voxels
            this.processRollerCrushing(dt, upgrades);
            // Auto-detach any voxels pushed past the roller bottom directly into the funnel
            const ejectThreshold = this.leftRoller.y + this.leftRoller.radius;
            for (let i = obj.voxels.length - 1; i >= 0; i--) {
                const v = obj.voxels[i];
                const vx = obj.x + (v.gx - bp.width / 2) * vSize;
                const vy = obj.y + (v.gy - bp.height / 2) * vSize;
                if (vy >= ejectThreshold) {
                    obj.voxels.splice(i, 1);
                    obj.destroyedVoxels++;
                    this.debrisList.push({
                        x: vx,
                        y: vy,
                        vx: (Math.random() - 0.5) * 50,
                        vy: 120 + Math.random() * 80,
                        size: vSize,
                        color: v.color,
                        value: v.value,
                        rot: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 10,
                        alpha: 1.0
                    });
                    this.pendingCrushEvents.push({
                        x: vx,
                        y: vy,
                        color: v.color,
                        count: 1
                    });
                    this.hasCrushOccurred = true;
                }
            }
        }
        // Check if all voxels are crushed
        if (obj.voxels.length === 0) {
            obj.isComplete = true;
            this.hasCompletedObject = true;
            this.nextObjectTimer = 0.35; // Quick satisfying pause before next drop
            // Completion cash bonus!
            const cashMult = this.overdriveActive ? 2 : 1;
            const bonusAmount = Math.max(10, Math.floor(bp.baseValue * bp.baseHp * 0.4 * cashMult));
            this.pendingCashEvents.push({
                x: 240,
                y: pinchY,
                amount: bonusAmount
            });
        }
    }
    /**
     * Checks collisions between roller teeth and voxels, tearing them apart
     */
    processRollerCrushing(dt, upgrades) {
        const obj = this.currentObject;
        if (!obj || obj.voxels.length === 0)
            return;
        const bp = obj.blueprint;
        const vSize = bp.voxelSize;
        const power = (10 + (upgrades.power - 1) * 7.5) * (this.overdriveActive ? 2.0 : 1.0);
        const rpm = this.leftRoller.rotationSpeed;
        const damagePerTick = power * rpm * dt * 3.5;
        // Get active teeth positions for left and right rollers
        const leftTeeth = this.getTeethTipPositions(this.leftRoller);
        const rightTeeth = this.getTeethTipPositions(this.rightRoller);
        const hitRadiusSq = Math.pow(vSize * 1.35, 2);
        let crushedThisTick = 0;
        for (let i = obj.voxels.length - 1; i >= 0; i--) {
            const v = obj.voxels[i];
            const vx = obj.x + (v.gx - bp.width / 2) * vSize;
            const vy = obj.y + (v.gy - bp.height / 2) * vSize;
            let hitTooth = null;
            // Check left roller teeth
            for (let t = 0; t < leftTeeth.length; t++) {
                const tooth = leftTeeth[t];
                const dx = vx - tooth.x;
                const dy = vy - tooth.y;
                if (dx * dx + dy * dy < hitRadiusSq) {
                    hitTooth = tooth;
                    break;
                }
            }
            // Check right roller teeth if not hit
            if (!hitTooth) {
                for (let t = 0; t < rightTeeth.length; t++) {
                    const tooth = rightTeeth[t];
                    const dx = vx - tooth.x;
                    const dy = vy - tooth.y;
                    if (dx * dx + dy * dy < hitRadiusSq) {
                        hitTooth = tooth;
                        break;
                    }
                }
            }
            // Also check central pinch drum pinch zone (between rollers)
            if (!hitTooth && vy >= this.leftRoller.y - 35 && vy <= this.leftRoller.y + 45) {
                const distFromCenter = Math.abs(vx - 240);
                if (distFromCenter < 35) {
                    hitTooth = {
                        x: 240,
                        y: vy,
                        vx: (vx < 240 ? 40 : -40),
                        vy: 120
                    };
                }
            }
            if (hitTooth) {
                // Apply damage
                v.hp -= damagePerTick;
                if (v.hp <= 0) {
                    // Voxel crushed! Detach and eject into funnel
                    obj.voxels.splice(i, 1);
                    obj.destroyedVoxels++;
                    crushedThisTick++;
                    // Eject debris with physical momentum
                    const initialVx = hitTooth.vx * 0.45 + (Math.random() - 0.5) * 60;
                    const initialVy = Math.max(90, hitTooth.vy * 0.6) + Math.random() * 80;
                    this.debrisList.push({
                        x: vx,
                        y: vy,
                        vx: initialVx,
                        vy: initialVy,
                        size: vSize,
                        color: v.color,
                        value: v.value,
                        rot: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 12,
                        alpha: 1.0
                    });
                    this.pendingCrushEvents.push({
                        x: vx,
                        y: vy,
                        color: v.color,
                        count: 1
                    });
                }
            }
        }
        if (crushedThisTick > 0) {
            this.hasCrushOccurred = true;
        }
    }
    /**
     * Computes the tip world coordinates and tangential velocities of a roller's teeth
     */
    getTeethTipPositions(roller) {
        const tips = [];
        const toothStep = (Math.PI * 2) / roller.teethCount;
        const totalRadius = roller.radius + roller.toothLength;
        for (let i = 0; i < roller.teethCount; i++) {
            const toothAngle = roller.angle + i * toothStep;
            const cosA = Math.cos(toothAngle);
            const sinA = Math.sin(toothAngle);
            const tipX = roller.x + totalRadius * cosA;
            const tipY = roller.y + totalRadius * sinA;
            // Tangential velocity: v = omega * r perpendicular to radius
            // In canvas (+y down), for clockwise (direction = 1): vx = -omega * r * sin(A), vy = omega * r * cos(A)
            const omega = roller.rotationSpeed * roller.direction;
            const vx = -omega * totalRadius * sinA;
            const vy = omega * totalRadius * cosA;
            // Only consider teeth facing the upper/center zone (contact zone)
            if (tipY < roller.y + 55) {
                tips.push({ x: tipX, y: tipY, vx, vy });
            }
        }
        return tips;
    }
    /**
     * Hydraulic Tap Slam: Deals immediate burst damage and crunches micro-blocks
     */
    triggerHydraulicSlam(tapX, tapY, upgrades) {
        if (!this.currentObject || this.currentObject.voxels.length === 0)
            return;
        this.slamProgress = 0;
        this.slamX = tapX;
        this.slamY = Math.max(180, Math.min(390, tapY));
        this.hasSlamOccurred = true;
        const bp = this.currentObject.blueprint;
        const vSize = bp.voxelSize;
        const slamPower = (25 + (upgrades.power - 1) * 18) * (this.overdriveActive ? 2.0 : 1.0);
        const slamRadiusSq = Math.pow(65, 2);
        let crushedCount = 0;
        for (let i = this.currentObject.voxels.length - 1; i >= 0; i--) {
            const v = this.currentObject.voxels[i];
            const vx = this.currentObject.x + (v.gx - bp.width / 2) * vSize;
            const vy = this.currentObject.y + (v.gy - bp.height / 2) * vSize;
            const dx = vx - this.slamX;
            const dy = vy - this.slamY;
            const distSq = dx * dx + dy * dy;
            if (distSq < slamRadiusSq) {
                v.hp -= slamPower;
                if (v.hp <= 0) {
                    this.currentObject.voxels.splice(i, 1);
                    this.currentObject.destroyedVoxels++;
                    crushedCount++;
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
                    const speed = 120 + Math.random() * 140;
                    this.debrisList.push({
                        x: vx,
                        y: vy,
                        vx: Math.cos(angle) * speed,
                        vy: Math.abs(Math.sin(angle) * speed) + 80,
                        size: vSize,
                        color: v.color,
                        value: v.value,
                        rot: Math.random() * Math.PI * 2,
                        vRot: (Math.random() - 0.5) * 15,
                        alpha: 1.0
                    });
                    this.pendingCrushEvents.push({
                        x: vx,
                        y: vy,
                        color: v.color,
                        count: 1
                    });
                }
            }
        }
        if (crushedCount > 0) {
            this.hasCrushOccurred = true;
        }
    }
    /**
     * Physics simulation for detached debris sliding down the funnel into collection intake
     */
    updateDebrisPhysics(dt) {
        const gravity = 680;
        const cashMult = this.overdriveActive ? 2 : 1;
        for (let i = this.debrisList.length - 1; i >= 0; i--) {
            const p = this.debrisList[i];
            // Gravity and motion
            p.vy += gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vRot * dt;
            // Air resistance
            p.vx *= Math.pow(0.96, dt * 60);
            // Funnel collision checks
            if (p.y >= this.funnelYStart && p.y <= this.funnelYEnd + 20) {
                // Linear interpolation of funnel walls at height p.y
                const t = Math.max(0, Math.min(1, (p.y - this.funnelYStart) / (this.funnelYEnd - this.funnelYStart)));
                const leftWallX = this.funnelLeftX1 + (this.funnelLeftX2 - this.funnelLeftX1) * t;
                const rightWallX = this.funnelRightX1 + (this.funnelRightX2 - this.funnelRightX1) * t;
                // Bounce and slide inward on left wall
                if (p.x < leftWallX) {
                    p.x = leftWallX;
                    p.vx = Math.abs(p.vx) * 0.4 + 35; // push toward center
                    p.vy *= 0.85; // sliding friction
                }
                // Bounce and slide inward on right wall
                if (p.x > rightWallX) {
                    p.x = rightWallX;
                    p.vx = -Math.abs(p.vx) * 0.4 - 35; // push toward center
                    p.vy *= 0.85; // sliding friction
                }
            }
            // Collection Drain Intake at funnel bottom
            if (p.y >= this.funnelYEnd) {
                // Collect cash!
                const earned = Math.max(1, Math.round(p.value * cashMult));
                this.pendingCashEvents.push({
                    x: p.x,
                    y: p.y,
                    amount: earned
                });
                // Remove collected voxel
                this.debrisList.splice(i, 1);
                continue;
            }
            // Safety purge if escaped or stuck
            if (p.y > 660 || p.x < 0 || p.x > this.width) {
                const earned = Math.max(1, Math.round(p.value * cashMult));
                this.pendingCashEvents.push({
                    x: 240,
                    y: this.funnelYEnd,
                    amount: earned
                });
                this.debrisList.splice(i, 1);
            }
        }
    }
    /**
     * Activates the 2-minute 2x Cash & Overdrive mode
     */
    activateOverdrive(durationSeconds = 120) {
        this.overdriveActive = true;
        this.overdriveRemaining = durationSeconds;
    }
}

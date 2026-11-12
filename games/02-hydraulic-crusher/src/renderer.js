/**
 * renderer.ts - 100% Procedural 2D Canvas Neon & Cyber Industrial Graphics
 * Zero external images or textures. All procedural geometry, lighting, and neon shaders.
 */
export class CrusherRenderer {
    ctx;
    animTime = 0;
    constructor(ctx) {
        this.ctx = ctx;
    }
    render(sim, droneMgr, dt) {
        this.animTime += dt;
        const ctx = this.ctx;
        ctx.save();
        // 1. Cyber Industrial Background
        this.renderIndustrialChamber(ctx, sim);
        // 2. Chute & Guide Rails
        this.renderChuteGuides(ctx, sim);
        // 3. Funnel & Collection Hopper
        this.renderFunnelHopper(ctx, sim);
        // 4. Overdrive Aura (if active)
        if (sim.overdriveActive) {
            this.renderOverdriveAura(ctx);
        }
        // 5. Falling Voxel Object
        if (sim.currentObject && !sim.currentObject.isComplete) {
            this.renderVoxelObject(ctx, sim.currentObject);
        }
        // 6. Dual Toothed Crushers
        this.renderRoller(ctx, sim.leftRoller, sim.overdriveActive);
        this.renderRoller(ctx, sim.rightRoller, sim.overdriveActive);
        // 7. Detached Debris in Funnel
        this.renderDebris(ctx, sim);
        // 8. Hydraulic Tap Slam Effect
        if (sim.slamProgress < 1.0) {
            this.renderHydraulicSlamEffect(ctx, sim);
        }
        // 9. Golden Drone (if active)
        if (droneMgr.drone && droneMgr.drone.active) {
            this.renderGoldenDrone(ctx, droneMgr.drone);
        }
        ctx.restore();
    }
    /**
     * Renders the industrial background with dark panels, rivets, and hazard accents
     */
    renderIndustrialChamber(ctx, sim) {
        // Deep metallic backdrop
        const grad = ctx.createLinearGradient(0, 0, 0, 800);
        grad.addColorStop(0, '#0a0b12');
        grad.addColorStop(0.5, '#0f111a');
        grad.addColorStop(1, '#08090f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 480, 800);
        // Subtle industrial grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 32;
        for (let x = 0; x <= 480; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 800);
            ctx.stroke();
        }
        for (let y = 0; y <= 800; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(480, y);
            ctx.stroke();
        }
        // Side Hydraulic Pistons with pulsing pressure lines
        const pistonPhase = Math.sin(this.animTime * (sim.overdriveActive ? 12 : 5));
        this.renderSidePiston(ctx, 35, 375, pistonPhase, sim.overdriveActive);
        this.renderSidePiston(ctx, 445, 375, pistonPhase, sim.overdriveActive);
        // Hazard stripes at top and sides
        this.renderHazardStripes(ctx, 50, 75, 380, 8);
    }
    /**
     * Renders animated hydraulic pistons mounted to the chamber sidewalls
     */
    renderSidePiston(ctx, x, y, phase, overdrive) {
        ctx.save();
        const isLeft = x < 240;
        const dir = isLeft ? 1 : -1;
        const strokeColor = overdrive ? '#ff3b00' : '#00f0ff';
        // Cylinder housing
        ctx.fillStyle = '#1e2230';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(isLeft ? 10 : 430, y - 40, 40, 80, 6);
        ctx.fill();
        ctx.stroke();
        // Chrome Piston shaft extending toward the roller
        const extension = 18 + phase * 6;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(isLeft ? 50 : 430 - extension, y - 10, extension, 20);
        // Pressure conduit neon tube
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = overdrive ? 12 : 6;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 50);
        ctx.lineTo(x, y - 75);
        ctx.lineTo(x + dir * 15, y - 90);
        ctx.stroke();
        ctx.restore();
    }
    /**
     * Renders hazard caution warning stripes
     */
    renderHazardStripes(ctx, x, y, w, h) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.fillStyle = '#1e2029';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#eab308';
        const stripeW = 12;
        for (let sx = x - h; sx < x + w + h; sx += stripeW * 2) {
            ctx.beginPath();
            ctx.moveTo(sx, y + h);
            ctx.lineTo(sx + h, y);
            ctx.lineTo(sx + h + stripeW, y);
            ctx.lineTo(sx + stripeW, y + h);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
    /**
     * Renders vertical neon guide rails for falling objects
     */
    renderChuteGuides(ctx, sim) {
        ctx.save();
        const railColor = sim.overdriveActive ? '#ff5500' : '#00f0ff';
        ctx.strokeStyle = railColor;
        ctx.shadowColor = railColor;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        // Left guide rail
        ctx.beginPath();
        ctx.moveTo(140, 80);
        ctx.lineTo(175, 275);
        ctx.stroke();
        // Right guide rail
        ctx.beginPath();
        ctx.moveTo(340, 80);
        ctx.lineTo(305, 275);
        ctx.stroke();
        // Subtle guide glow beams
        ctx.fillStyle = sim.overdriveActive ? 'rgba(255, 68, 0, 0.04)' : 'rgba(0, 240, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(140, 80);
        ctx.lineTo(340, 80);
        ctx.lineTo(305, 275);
        ctx.lineTo(175, 275);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    /**
     * Renders the bottom debris collection funnel and illuminated cash intake
     */
    renderFunnelHopper(ctx, sim) {
        ctx.save();
        const glowColor = sim.overdriveActive ? '#ff7700' : '#00ffcc';
        // Funnel body
        ctx.fillStyle = '#10121a';
        ctx.beginPath();
        ctx.moveTo(sim.funnelLeftX1, sim.funnelYStart);
        ctx.lineTo(sim.funnelLeftX2, sim.funnelYEnd);
        ctx.lineTo(sim.funnelRightX2, sim.funnelYEnd);
        ctx.lineTo(sim.funnelRightX1, sim.funnelYStart);
        ctx.closePath();
        ctx.fill();
        // Funnel illuminated guide walls
        ctx.strokeStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        // Left wall
        ctx.beginPath();
        ctx.moveTo(sim.funnelLeftX1, sim.funnelYStart);
        ctx.lineTo(sim.funnelLeftX2, sim.funnelYEnd);
        ctx.stroke();
        // Right wall
        ctx.beginPath();
        ctx.moveTo(sim.funnelRightX1, sim.funnelYStart);
        ctx.lineTo(sim.funnelRightX2, sim.funnelYEnd);
        ctx.stroke();
        // Collection Intake Slot (Vacuum / Sump)
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#05060a';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(sim.funnelLeftX2 - 4, sim.funnelYEnd, sim.funnelRightX2 - sim.funnelLeftX2 + 8, 28, 4);
        ctx.fill();
        ctx.stroke();
        // Holographic Dollar sign at intake
        ctx.fillStyle = glowColor;
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const pulseScale = 1 + Math.sin(this.animTime * 6) * 0.12;
        ctx.save();
        ctx.translate(240, sim.funnelYEnd + 14);
        ctx.scale(pulseScale, pulseScale);
        ctx.fillText('$', 0, 0);
        ctx.restore();
        ctx.restore();
    }
    /**
     * Renders the Overdrive fiery heat distortion and plasma rim
     */
    renderOverdriveAura(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Fiery heat gradient at pinch zone
        const pinchGlow = ctx.createRadialGradient(240, 375, 10, 240, 375, 160);
        pinchGlow.addColorStop(0, 'rgba(255, 60, 0, 0.45)');
        pinchGlow.addColorStop(0.4, 'rgba(255, 140, 0, 0.2)');
        pinchGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = pinchGlow;
        ctx.fillRect(100, 240, 280, 260);
        // Fiery flame tongues rising from rollers
        for (let i = 0; i < 14; i++) {
            const angle = this.animTime * 10 + (i * Math.PI) / 7;
            const flameX = 240 + Math.sin(angle) * 75;
            const flameY = 375 - 40 - Math.abs(Math.cos(angle * 1.5)) * 40;
            const flameSize = 4 + (i % 4) * 2;
            ctx.fillStyle = i % 2 === 0 ? '#ff3b00' : '#ffea00';
            ctx.shadowColor = '#ff5500';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    /**
     * Renders a single toothed hydraulic roller
     */
    renderRoller(ctx, roller, overdrive) {
        ctx.save();
        ctx.translate(roller.x, roller.y);
        const neonPrimary = overdrive ? '#ff3300' : '#00f0ff';
        const neonSecondary = overdrive ? '#ffbb00' : '#38bdf8';
        const drumR = roller.radius;
        const toothLen = roller.toothLength;
        const toothStep = (Math.PI * 2) / roller.teethCount;
        // --- 1. Neon Hardened Teeth ---
        ctx.save();
        ctx.rotate(roller.angle);
        for (let i = 0; i < roller.teethCount; i++) {
            ctx.save();
            ctx.rotate(i * toothStep);
            const toothHalfW = roller.toothWidth / 2;
            // Tooth geometry: solid trapezoid tapering to sharp hardened tip
            ctx.beginPath();
            ctx.moveTo(drumR - 2, -toothHalfW);
            ctx.lineTo(drumR + toothLen, -toothHalfW * 0.35);
            ctx.lineTo(drumR + toothLen, toothHalfW * 0.35);
            ctx.lineTo(drumR - 2, toothHalfW);
            ctx.closePath();
            // Tooth fill
            const toothGrad = ctx.createLinearGradient(drumR, 0, drumR + toothLen, 0);
            toothGrad.addColorStop(0, '#1e2436');
            toothGrad.addColorStop(0.7, '#475569');
            toothGrad.addColorStop(1, neonSecondary);
            ctx.fillStyle = toothGrad;
            ctx.fill();
            // Glowing tooth edge
            ctx.strokeStyle = neonPrimary;
            ctx.shadowColor = neonPrimary;
            ctx.shadowBlur = overdrive ? 12 : 6;
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
        // --- 2. Heavy Cylindrical Drum Body ---
        // Outer drum ring
        ctx.shadowBlur = overdrive ? 16 : 8;
        ctx.shadowColor = neonPrimary;
        ctx.fillStyle = '#131622';
        ctx.strokeStyle = neonPrimary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, drumR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Concentric metallic groove
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, drumR * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        // --- 3. Rotating Mechanical Spokes ---
        ctx.save();
        ctx.rotate(roller.angle);
        ctx.strokeStyle = neonSecondary;
        ctx.lineWidth = 3;
        const spokeCount = 5;
        for (let s = 0; s < spokeCount; s++) {
            const spokeAngle = (s * Math.PI * 2) / spokeCount;
            ctx.beginPath();
            ctx.moveTo(Math.cos(spokeAngle) * 18, Math.sin(spokeAngle) * 18);
            ctx.lineTo(Math.cos(spokeAngle) * (drumR * 0.72), Math.sin(spokeAngle) * (drumR * 0.72));
            ctx.stroke();
        }
        ctx.restore();
        // --- 4. Central Hub & High-Torque Bearing ---
        const hubGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
        hubGrad.addColorStop(0, neonSecondary);
        hubGrad.addColorStop(0.4, '#1e293b');
        hubGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        // Center Axle Bolt
        ctx.fillStyle = neonPrimary;
        ctx.shadowColor = neonPrimary;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    /**
     * Renders the falling voxel object with 2.5D beveling and damage indicators
     */
    renderVoxelObject(ctx, obj) {
        ctx.save();
        const bp = obj.blueprint;
        const vSize = bp.voxelSize;
        // Draw object voxels
        for (let i = 0; i < obj.voxels.length; i++) {
            const v = obj.voxels[i];
            const vx = obj.x + (v.gx - bp.width / 2) * vSize;
            const vy = obj.y + (v.gy - bp.height / 2) * vSize;
            // Base voxel fill
            ctx.fillStyle = v.color;
            ctx.fillRect(vx, vy, vSize - 0.5, vSize - 0.5);
            // 2.5D Top/Left highlight bevel
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(vx, vy, vSize - 0.5, 1.5); // top edge
            ctx.fillRect(vx, vy, 1.5, vSize - 0.5); // left edge
            // 2.5D Bottom/Right shadow bevel
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(vx, vy + vSize - 2, vSize - 0.5, 1.5); // bottom edge
            ctx.fillRect(vx + vSize - 2, vy, 1.5, vSize - 0.5); // right edge
            // Damage crack overlay if HP < maxHp
            if (v.hp < v.maxHp) {
                const damageRatio = 1 - v.hp / v.maxHp;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * damageRatio})`;
                ctx.fillRect(vx, vy, vSize - 0.5, vSize - 0.5);
                // Crack line
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(vx + 1, vy + 2);
                ctx.lineTo(vx + vSize - 2, vy + vSize - 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    /**
     * Renders detached debris tumbling down the funnel
     */
    renderDebris(ctx, sim) {
        if (sim.debrisList.length === 0)
            return;
        ctx.save();
        for (let i = 0; i < sim.debrisList.length; i++) {
            const p = sim.debrisList[i];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            const half = p.size / 2;
            ctx.fillRect(-half, -half, p.size, p.size);
            // Specular shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(-half, -half, p.size * 0.4, p.size * 0.4);
            ctx.restore();
        }
        ctx.restore();
    }
    /**
     * Renders the hydraulic tap slam shockwave effect
     */
    renderHydraulicSlamEffect(ctx, sim) {
        ctx.save();
        const progress = sim.slamProgress; // 0 to 1
        const alpha = 1 - progress;
        const radius = 20 + progress * 75;
        // Shockwave expansion ring
        ctx.strokeStyle = `rgba(255, 170, 0, ${alpha})`;
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 4 * (1 - progress);
        ctx.beginPath();
        ctx.arc(sim.slamX, sim.slamY, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Hydraulic ram hammer outline descending
        const hammerH = 50 * (1 - progress);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.fillRect(sim.slamX - 35, sim.slamY - hammerH, 70, hammerH);
        ctx.restore();
    }
    /**
     * Renders the Golden Cyber Drone flying across the screen
     */
    renderGoldenDrone(ctx, drone) {
        ctx.save();
        ctx.translate(drone.x, drone.y);
        // Glowing golden beacon aura
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        // Drone main chassis (aerodynamic cyber pod)
        const hullGrad = ctx.createLinearGradient(-26, 0, 26, 0);
        hullGrad.addColorStop(0, '#b45309');
        hullGrad.addColorStop(0.5, '#fef08a');
        hullGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Holographic Dollar / Prize container beneath
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = '900 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 10);
        // Rotor boom arms
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-28, -6);
        ctx.lineTo(-38, -14);
        ctx.moveTo(28, -6);
        ctx.lineTo(38, -14);
        ctx.stroke();
        // Spinning neon rotors
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        // Left rotor
        const rW = 16 * Math.cos(drone.rotorAngle);
        ctx.beginPath();
        ctx.moveTo(-38 - rW, -14);
        ctx.lineTo(-38 + rW, -14);
        ctx.stroke();
        // Right rotor
        const rW2 = 16 * Math.cos(drone.rotorAngle + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(38 - rW2, -14);
        ctx.lineTo(38 + rW2, -14);
        ctx.stroke();
        // Floating label: "TAP DRONE!"
        ctx.fillStyle = '#ffea00';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 6;
        ctx.fillText('⚡ TAP FOR BOUNTY!', 0, -22);
        ctx.restore();
    }
}

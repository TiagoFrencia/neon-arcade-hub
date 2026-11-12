import Matter from 'matter-js';
import { CONTAINER, TIERS } from './constants';
const { Engine, Bodies, Composite, Events } = Matter;
export class PhysicsWorld {
    engine;
    queuedRemovals = [];
    queuedAdditions = [];
    mergeEvents = [];
    onMergeCallback;
    constructor() {
        this.engine = Engine.create({
            gravity: { x: 0, y: 1.8, scale: 0.001 },
            enableSleeping: false
        });
        this.setupBoundaries();
        this.setupCollisionHandler();
    }
    setOnMergeCallback(cb) {
        this.onMergeCallback = cb;
    }
    setupBoundaries() {
        const wallY = (CONTAINER.top + CONTAINER.bottom) / 2;
        const wallHeight = CONTAINER.bottom - CONTAINER.top + 40;
        const floorWidth = (CONTAINER.right - CONTAINER.left) + CONTAINER.wallThickness * 2 + 40;
        // Left wall
        const leftWall = Bodies.rectangle(CONTAINER.left - CONTAINER.wallThickness / 2, wallY, CONTAINER.wallThickness, wallHeight, {
            isStatic: true,
            friction: 0.1,
            restitution: 0.25,
            label: 'wall_left'
        });
        // Right wall
        const rightWall = Bodies.rectangle(CONTAINER.right + CONTAINER.wallThickness / 2, wallY, CONTAINER.wallThickness, wallHeight, {
            isStatic: true,
            friction: 0.1,
            restitution: 0.25,
            label: 'wall_right'
        });
        // Bottom floor
        const floor = Bodies.rectangle((CONTAINER.left + CONTAINER.right) / 2, CONTAINER.bottom + CONTAINER.floorThickness / 2, floorWidth, CONTAINER.floorThickness, {
            isStatic: true,
            friction: 0.35,
            restitution: 0.15,
            label: 'floor'
        });
        Composite.add(this.engine.world, [leftWall, rightWall, floor]);
    }
    setupCollisionHandler() {
        Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                this.checkMerge(pair.bodyA, pair.bodyB);
            }
        });
        Events.on(this.engine, 'afterUpdate', () => {
            this.processQueues();
        });
    }
    checkMerge(bodyA, bodyB) {
        const dataA = bodyA.customData;
        const dataB = bodyB.customData;
        if (!dataA || !dataB)
            return;
        if (dataA.isMerged || dataB.isMerged)
            return;
        // Rainbow merge condition
        if (dataA.isRainbow || dataB.isRainbow) {
            dataA.isMerged = true;
            dataB.isMerged = true;
            const baseTier = dataA.isRainbow ? dataB.tier : dataA.tier;
            const targetTier = Math.min(10, baseTier + 1);
            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;
            const points = TIERS[targetTier - 1].points * 2;
            this.queuedRemovals.push(bodyA, bodyB);
            this.mergeEvents.push({
                bodyA,
                bodyB,
                midX,
                midY,
                newTier: targetTier,
                points,
                isRainbow: true,
                isSupernova: false
            });
            const newBody = this.createPieceBody(midX, midY, targetTier);
            this.queuedAdditions.push(newBody);
            return;
        }
        // Normal same-tier merge
        if (dataA.tier === dataB.tier) {
            dataA.isMerged = true;
            dataB.isMerged = true;
            const currentTier = dataA.tier;
            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;
            this.queuedRemovals.push(bodyA, bodyB);
            if (currentTier < 10) {
                const newTier = currentTier + 1;
                const points = TIERS[newTier - 1].points;
                this.mergeEvents.push({
                    bodyA,
                    bodyB,
                    midX,
                    midY,
                    newTier,
                    points,
                    isRainbow: false,
                    isSupernova: false
                });
                const newBody = this.createPieceBody(midX, midY, newTier);
                this.queuedAdditions.push(newBody);
            }
            else {
                // Level 10 Supernova merge (Max level bonus!)
                this.mergeEvents.push({
                    bodyA,
                    bodyB,
                    midX,
                    midY,
                    newTier: 10,
                    points: 2500,
                    isRainbow: false,
                    isSupernova: true
                });
            }
        }
    }
    processQueues() {
        if (this.queuedRemovals.length > 0) {
            for (const body of this.queuedRemovals) {
                Composite.remove(this.engine.world, body);
            }
            this.queuedRemovals = [];
        }
        if (this.queuedAdditions.length > 0) {
            for (const body of this.queuedAdditions) {
                Composite.add(this.engine.world, body);
            }
            this.queuedAdditions = [];
        }
        if (this.mergeEvents.length > 0) {
            for (const ev of this.mergeEvents) {
                this.onMergeCallback?.(ev);
            }
            this.mergeEvents = [];
        }
    }
    createPieceBody(x, y, tier, isRainbow = false) {
        const config = TIERS[tier - 1];
        const radius = config.radius;
        // Clamped spawn within container walls
        const clampedX = Math.max(CONTAINER.left + radius + 4, Math.min(CONTAINER.right - radius - 4, x));
        const body = Bodies.circle(clampedX, y, radius, {
            restitution: 0.22,
            friction: 0.15,
            frictionAir: 0.003,
            density: 0.002 * (1 + tier * 0.1),
            label: `piece_${tier}`
        });
        const customData = {
            tier,
            isRainbow,
            isMerged: false,
            spawnTime: performance.now(),
            settled: false,
            rainbowHue: Math.random() * 360
        };
        body.customData = customData;
        return body;
    }
    addPiece(body) {
        Composite.add(this.engine.world, body);
    }
    removePiece(body) {
        const data = body.customData;
        if (data) {
            data.isMerged = true;
        }
        Composite.remove(this.engine.world, body);
    }
    getAllPieces() {
        const bodies = Composite.allBodies(this.engine.world);
        return bodies.filter((b) => {
            const data = b.customData;
            return !!data && !data.isMerged;
        });
    }
    clearAllPieces() {
        const pieces = this.getAllPieces();
        for (const piece of pieces) {
            Composite.remove(this.engine.world, piece);
        }
        this.queuedRemovals = [];
        this.queuedAdditions = [];
        this.mergeEvents = [];
    }
    update(dt) {
        // Fixed step for deterministic and stable physics
        const clampedDt = Math.min(dt, 0.05);
        Engine.update(this.engine, clampedDt * 1000);
    }
}

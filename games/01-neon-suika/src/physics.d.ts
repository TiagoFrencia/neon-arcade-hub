import Matter from 'matter-js';
export interface MergeEvent {
    bodyA: Matter.Body;
    bodyB: Matter.Body;
    midX: number;
    midY: number;
    newTier: number;
    points: number;
    isRainbow: boolean;
    isSupernova: boolean;
}
export declare class PhysicsWorld {
    engine: Matter.Engine;
    private queuedRemovals;
    private queuedAdditions;
    private mergeEvents;
    private onMergeCallback?;
    constructor();
    setOnMergeCallback(cb: (event: MergeEvent) => void): void;
    private setupBoundaries;
    private setupCollisionHandler;
    private checkMerge;
    private processQueues;
    createPieceBody(x: number, y: number, tier: number, isRainbow?: boolean): Matter.Body;
    addPiece(body: Matter.Body): void;
    removePiece(body: Matter.Body): void;
    getAllPieces(): Matter.Body[];
    clearAllPieces(): void;
    update(dt: number): void;
}

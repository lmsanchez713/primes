import { Entity } from './entity.js';
import { Mat4 } from '../math.js';

export class World extends Entity {
    constructor(chunkWidth, chunkHeight, transform) {
        super();
        // chunkWidth/Height: number of chunks in X and Y directions (historical/optional)
        this.chunkWidth = chunkWidth; 
        this.chunkHeight = chunkHeight;

        // Sparse Map<x, Map<y, Chunk>>
        this.chunks = new Map(); 
        
        // The logical grid of tiles (GameItems)
        // Map<y, Map<x, [GameItem, ...]>>
        this.grid = new Map();
        
        // Entities that are "walking" on the grid.
        // Map: entity -> {x, y}
        this.actors = new Map();

        if (transform) {
            this.transform = transform;
        }
    }

    setGrid(grid) {
        this.grid = grid;
    }

    addChunk(cx, cy, chunk) {
        if (!this.chunks.has(cx)) {
            this.chunks.set(cx, new Map());
        }
        this.chunks.get(cx).set(cy, chunk);
    }

    getChunk(cx, cy) {
        const col = this.chunks.get(cx);
        if (col) {
            return col.get(cy) || null;
        }
        return null;
    }

    /**
     * Register an actor in the world at a specific grid position.
     * @param {Entity} entity 
     * @param {number} x 
     * @param {number} y 
     */
    addActor(entity, x, y) {
        this.actors.set(entity, { x, y });
    }

    /**
     * Logic to move an entity from one tile to another
     * @param {Entity} entity 
     * @param {number} newX 
     * @param {number} newY 
     * @returns {boolean} success
     */
    moveEntity(entity, newX, newY) {
        const actorInfo = this.actors.get(entity);
        if (!actorInfo) return false;

        const oldX = actorInfo.x;
        const oldY = actorInfo.y;

        if (oldX === newX && oldY === newY) return true;

        // 1. Check collisions/callbacks at the target tile
        const targetCol = this.grid.get(newY);
        const targetTileItems = targetCol?.get(newX);
        if (!targetTileItems) return false;

        for (const item of targetTileItems) {
            if (item.callbacks?.on_move_into) {
                item.callbacks.on_move_into(entity, { x: oldX, y: oldY }, { x: newX, y: newY });
            }
        }

        // 2. Check callbacks at the current tile (moving away)
        const currentCol = this.grid.get(oldY);
        const currentTileItems = currentCol?.get(oldX);
        if (currentTileItems) {
            for (const item of currentTileItems) {
                if (item.callbacks?.on_move_from) {
                    item.callbacks.on_move_from(entity, { x: oldX, y: oldY }, { x: newX, y: newY });
                }
            }
        }

        // 3. Update internal state
        actorInfo.x = newX;
        actorInfo.y = newY;

        return true;
    }

    update(deltaTime) {
        for (const col of this.chunks.values()) {
            for (const chunk of col.values()) {
                if (chunk) chunk.update(deltaTime);
            }
        }
        super.update(deltaTime);
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights, engine) {
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        for (const col of this.chunks.values()) {
            for (const chunk of col.values()) {
                if (chunk) {
                    chunk.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights, engine);
                }
            }
        }

        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights, engine);
        }
    }
}

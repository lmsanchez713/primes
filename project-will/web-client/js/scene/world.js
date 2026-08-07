import { Entity } from './entity.js';
import { Mat4 } from '../math.js';

export class World extends Entity {
    constructor(chunkWidth, chunkHeight, transform) {
        super();
        // chunkWidth/Height: number of chunks in X and Y directions
        this.chunkWidth = chunkWidth; 
        this.chunkHeight = chunkHeight;
        this.chunks = Array.from({ length: chunkWidth }, () =>
            Array.from({ length: chunkHeight }, () => null)
        );
        
        // The logical grid of tiles (GameItems)
        // This is the "real" map.
        this.grid = []; // 2D array: [y][x] = [GameItem, GameItem, ...]
        
        // Entities that are "walking" on the grid
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
        if (cx >= 0 && cx < this.chunkWidth && cy >= 0 && cy < this.chunkHeight) {
            this.chunks[cx][cy] = chunk;
        }
    }

    getChunk(cx, cy) {
        if (cx >= 0 && cx < this.chunkWidth && cy >= 0 && cy < this.chunkHeight) {
            return this.chunks[cx][cy];
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
        // In a real implementation, you'd update the entity's transform here
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
        const targetTileItems = this.grid[newY]?.[newX];
        if (!targetTileItems) return false;

        for (const item of targetTileItems) {
            if (item.callbacks.on_move_into) {
                item.callbacks.on_move_into(entity, { x: oldX, y: oldY }, { x: newX, y: newY });
            }
        }

        // 2. Check callbacks at the current tile (moving away)
        const currentTileItems = this.grid[oldY]?.[oldX];
        if (currentTileItems) {
            for (const item of currentTileItems) {
                if (item.callbacks.on_move_from) {
                    item.callbacks.on_move_from(entity, { x: oldX, y: oldY }, { x: newX, y: newY });
                }
            }
        }

        // 3. Update internal state
        actorInfo.x = newX;
        actorInfo.y = newY;
        // Here you would also update the entity's actual transform for rendering
        // e.g. entity.transform.setTranslation(newX * tile_size, ...);

        return true;
    }

    update(deltaTime) {
        for (let x = 0; x < this.chunkWidth; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                const chunk = this.chunks[x][y];
                if (chunk) chunk.update(deltaTime);
            }
        }
        super.update(deltaTime);
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights) {
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        for (let x = 0; x < this.chunkWidth; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                const chunk = this.chunks[x][y];
                if (chunk) {
                    chunk.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
                }
            }
        }

        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
        }
    }
}

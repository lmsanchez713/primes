import { Entity } from './entity.js';
import { Chunk } from './chunk.js';
import { Mat4, OrthoMat4 } from '../math.js';

export class World extends Entity {
    constructor(chunkWidth, chunkHeight, transform) {
        super();
        // Physical dimensions of a single chunk in world units
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

    /**
     * Adds a chunk to the world and automatically sets its transform 
     * based on its grid position and the world's chunk dimensions.
     * 
     * @param {number} cx - Chunk X coordinate (can be negative)
     * @param {number} cy - Chunk Y coordinate (can be negative)
     * @param {Chunk} chunk - The chunk instance
     */
    addChunk(cx, cy, chunk) {
        // 1. Calculate the world-space position of this chunk
        const x = cx * this.chunkWidth;
        const y = cy * this.chunkHeight;

        // 2. Set the chunk's transform to be a translation to its grid position
        chunk.transform = new Mat4();
        Mat4.translation(x, y, 0, chunk.transform);

        // 3. Add to the sparse map
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

    addActor(entity, x, y) {
        this.actors.set(entity, { x, y });
    }

    moveEntity(entity, newX, newY) {
        const actorInfo = this.actors.get(entity);
        if (!actorInfo) return false;

        const oldX = actorInfo.x;
        const oldY = actorInfo.y;

        if (oldX === newX && oldY === newY) return true;

        const targetCol = this.grid.get(newY);
        const targetTileItems = targetCol?.get(newX);
        if (!targetTileItems) return false;

        for (const item of targetTileItems) {
            if (item.callbacks?.on_move_into) {
                item.callbacks.on_move_into(entity, { x: oldX, y: oldY }, { x: newX, y: newY });
            }
        }

        const currentCol = this.grid.get(oldY);
        const currentTileItems = currentCol?.get(oldX);
        if (currentTileItems) {
            for (const item of currentTileItems) {
                if (item.callbacks?.on_move_from) {
                    item.callbacks.on_move_from(entity, { x: oldX, y: oldY }, { x: newX, y: newY });
                }
            }
        }

        actorInfo.x = newX;
        actorInfo.y = newY;

        return true;
    }

    /**
    * Gets the array of entities at a specific world coordinate.
    * If the chunk or the tile does not exist, it creates them on the fly.
    * 
    * @param {number} worldX - The world-space X coordinate.
    * @param {number} worldY - The world-space Y coordinate.
    * @returns {Entity[]} The array of entities in that tile.
    */
    getTile(worldX, worldY) {
        // 1. Determine which chunk the coordinate belongs to
        const cx = Math.floor(worldX / this.chunkWidth);
        const cy = Math.floor(worldY / this.chunkHeight);

        // 2. Get or create the chunk
        let chunk = this.getChunk(cx, cy);
        if (!chunk) {
            chunk = new Chunk(this.chunkWidth, this.chunkHeight);
            this.addChunk(cx, cy, chunk);
        }

        // 3. Calculate local tile indices within that chunk
        // We use Math.floor to ensure we are targeting the specific integer tile index
        const lx = Math.floor(worldX) - (cx * this.chunkWidth);
        const ly = Math.floor(worldY) - (cy * this.chunkHeight);

        // 4. Ensure the column (Map<y, Entity[]>) exists in the chunk's grid
        if (!chunk.grid.has(lx)) {
            chunk.grid.set(lx, new Map());
        }
        const col = chunk.grid.get(lx);

        // 5. Ensure the cell (Entity[]) exists in the column
        if (!col.has(ly)) {
            col.set(ly, []);
        }

        return col.get(ly);
    }

    /**
     * Adds an entity to the tile at the specified world coordinate.
     * 
     * @param {number} worldX - The world-space X coordinate.
     * @param {number} worldY - The world-space Y coordinate.
     * @param {Entity} entity - The entity to add.
     */
    addEntityToTile(worldX, worldY, entity) {
        // getTile handles all the creation logic
        const tile = this.getTile(worldX, worldY);

        // Determine which chunk the coordinate belongs to
        const cx = Math.floor(worldX / this.chunkWidth);
        const cy = Math.floor(worldY / this.chunkHeight);

        const lx = Math.floor(worldX) - (cx * this.chunkWidth);
        const ly = Math.floor(worldY) - (cy * this.chunkHeight);

        entity.transform = OrthoMat4(lx, ly);

        tile.push(entity);
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

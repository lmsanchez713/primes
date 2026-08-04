import { Entity } from './entity.js';
import { Mat4 } from '../math.js';

export class Chunk extends Entity {
    constructor(width, height) {
        // Call Entity constructor to initialize transform and worldMatrix
        super();
        this.width = width;
        this.height = height;
        this.grid = Array.from({ length: width }, () =>
            Array.from({ length: height }, () => [])
        );
    }

    addEntity(x, y, entity) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[x][y].push(entity);
        }
    }

    update(deltaTime) {
        // Update entities within the chunk's grid
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.grid[x][y];
                for (const entity of cell) {
                    entity.update(deltaTime);
                }
            }
        }
        // Allow Chunk to also update its own children (if added via Entity.add)
        super.update(deltaTime);
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights) {
        // 1. Calculate this chunk's world matrix based on parent (the World)
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        // 2. Render entities in the grid using this chunk's world matrix
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.grid[x][y];
                for (const entity of cell) {
                    // Pass the chunk's world matrix as the new parent matrix for the entity
                    entity.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
                }
            }
        }

        // 3. Render standard Entity children (if any)
        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
        }
    }
}

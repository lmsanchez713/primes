import { Entity } from './entity.js';
import { Mat4 } from '../math.js';

export class Chunk extends Entity {
    constructor(width, height, transform = new Mat4()) {
        // Call Entity constructor to initialize transform and worldMatrix
        super();
        this.width = width;
        this.height = height;
        // Sparse Map<x, Map<y, Entity[]>>
        this.grid = new Map();
        this.transform = transform;
    }

    addEntity(x, y, entity) {
        if (!this.grid.has(x)) {
            this.grid.set(x, new Map());
        }
        const col = this.grid.get(x);
        if (!col.has(y)) {
            col.set(y, []);
        }
        col.get(y).push(entity);
    }

    update(deltaTime) {
        // Update entities within the chunk's grid
        for (const col of this.grid.values()) {
            for (const cell of col.values()) {
                for (const entity of cell) {
                    entity.update(deltaTime);
                }
            }
        }
        // Allow Chunk to also update its own children (if added to Entity)
        super.update(deltaTime);
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights, engine) {
        // 1. Calculate this chunk's world matrix based on parent (the World)
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        // 2. Render entities in the grid using this chunk's world matrix
        for (const col of this.grid.values()) {
            for (const cell of col.values()) {
                for (const entity of cell) {
                    // Pass the chunk's world matrix as the new parent matrix for the entity
                    entity.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights, engine);
                }
            }
        }

        // 3. Render standard Entity children (if any)
        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights, engine);
        }
    }
}

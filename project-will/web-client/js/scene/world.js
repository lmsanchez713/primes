import { Entity } from './entity.js';
import { Mat4 } from '../math.js';

export class World extends Entity {
    constructor(chunkWidth, chunkHeight) {
        super();
        this.chunkWidth = chunkWidth;
        this.chunkHeight = chunkHeight;
        this.chunks = Array.from({ length: chunkWidth }, () =>
            Array.from({ length: chunkHeight }, () => null)
        );
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

    update(deltaTime) {
        // Update chunks
        for (let x = 0; x < this.chunkWidth; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                const chunk = this.chunks[x][y];
                if (chunk) chunk.update(deltaTime);
            }
        }
        // Update children (if any)
        super.update(deltaTime);
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights) {
        // Update this entity's world matrix
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        // Render chunks
        for (let x = 0; x < this.chunkWidth; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                const chunk = this.chunks[x][y];
                if (chunk) {
                    chunk.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
                }
            }
        }

        // Render children (if any)
        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
        }
    }
}

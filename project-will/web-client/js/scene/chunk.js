export class Chunk {
    constructor(width, height) {
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
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.grid[x][y];
                for (const entity of cell) {
                    entity.update(deltaTime);
                }
            }
        }
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.grid[x][y];
                for (const entity of cell) {
                    entity.render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights);
                }
            }
        }
    }
}

import { Vec3, Mat4 } from '/js/math.js';

export class mesh {
    constructor(engine, geometry, shader_name, model_matrix = new Mat4()) {
        this.engine = engine;
        this.geometry = geometry;
        this.shader_name = shader_name;
        this.model_matrix = model_matrix;
    }
}

export class path {
    constructor(vertices = [], closed = false) {
        this.vertices = vertices;
        this.closed = closed;
    }

    add(vertex) {
        this.vertices.push(vertex);
    }

    close() {
        this.closed = true;
    }
}
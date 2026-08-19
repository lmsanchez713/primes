import { Buffer } from './buffer.js';

export class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
    }

    bind(engine) {
        engine.state.bindVertexArray(this.vao);
    }

    //unbind() {
    //    this.gl.state.bindVertexArray(null);
    //}
}

export class Geometry {
    constructor(gl, mode = gl.TRIANGLES) {
        this.gl = gl;
        this.mode = mode;
        this.count = 0;
        this.vao = new VertexArray(gl);
        this.buffers = [];
    }

    addAttribute(buffer, location, size, type = this.gl.FLOAT) {
        this.gl.bindVertexArray(this.vao.vao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.buffer);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, type, false, 0, 0);
        this.buffers.push(buffer);
    }

    setCount(count) {
        this.count = count;
    }

    bind(engine) {
        this.vao.bind(engine);
    }

    draw() {
        if (this.count === 0) return;
        this.gl.drawArrays(this.mode, 0, this.count);
    }
}

export function createSquareGeometry(gl, shader) {
    // Vertices for two triangles forming a quad
    const vertices = new Float32Array([
        -0.5, -0.5, 0.0, // v0
        0.5, 0.5, 0.0, // v1
        -0.5, 0.5, 0.0, // v2
        -0.5, -0.5, 0.0, // v3
        0.5, -0.5, 0.0, // v4
        0.5, 0.5, 0.0  // v5
    ]);

    // Texture coordinates
    const texCoords = new Float32Array([
        0.0, 0.0, // v0
        1.0, 1.0, // v1
        0.0, 1.0, // v2
        0.0, 0.0, // v3
        1.0, 0.0, // v4
        1.0, 1.0  // v5
    ]);

    // Normals (pointing towards the camera)
    const normals = new Float32Array([
        0, 0, 1, // v0
        0, 0, 1, // v1
        0, 0, 1, // v2
        0, 0, 1, // v3
        0, 0, 1, // v4
        0, 0, 1 // v5
    ]);

    // Tangents (for normal mapping support)
    //const tangents = new Float32Array([
    //    0, 1, 0, 0, 1, 0, 0, 1, 0,
    //    0, 1, 0, 0, 1, 0, 0, 1, 0
    //]);

    const geo = new Geometry(gl, gl.TRIANGLES);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, vertices), gl.getAttribLocation(shader.program, 'aPosition'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, texCoords), gl.getAttribLocation(shader.program, 'aTexCoord'), 2);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, normals), gl.getAttribLocation(shader.program, 'aNormal'), 3);
    //geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, tangents), gl.getAttribLocation(shader.program, 'aTangent'), 3);
    geo.setCount(6);

    return geo;
}
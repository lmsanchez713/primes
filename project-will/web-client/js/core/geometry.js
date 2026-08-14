export class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
    }

    bind(engine) {
        engine.state.bindVertexArray(this.vao);
    }

    unbind() {
        //this.gl.state.bindVertexArray(null);
    }
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
    //
}
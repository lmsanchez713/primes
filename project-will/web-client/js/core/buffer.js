export class Buffer {
    constructor(gl, type, data, usage = gl.STATIC_DRAW) {
        this.gl = gl;
        this.type = type;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(this.type, this.buffer);
        gl.bufferData(this.type, data, usage);
    }

    bind() {
        this.gl.bindBuffer(this.type, this.buffer);
    }
}

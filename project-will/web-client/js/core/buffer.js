export class Buffer {
    constructor(engine, type, data, usage = engine.gl.STATIC_DRAW) {
        this.engine = engine;
        this.type = type;
        this.usage = usage;
        this.buffer = this.engine.gl.createBuffer();
        this.length = data.length ?? data;
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.bufferData(this.type, data, this.usage);
    }

    bind() {
        this.engine.gl.bindBuffer(this.type, this.buffer);
    }

    bind_base(shader, name, index) {
        const blockIndex = this.engine.gl.getUniformBlockIndex(shader.program, name);
        this.engine.gl.uniformBlockBinding(shader.program, blockIndex, 0);
        this.engine.gl.bindBufferBase(this.type, index, this.buffer);
    }

    data(new_data) {
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.bufferData(this.type, new_data, this.usage);
        this.length = new_data.length;
    }

    subdata(data, offset = 0, src_offset = 0, length = data.length - src_offset) {
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.bufferSubData(this.type, offset, data, src_offset, length);
    } // TO-DO: add error checking for subdata -- CHECK LENGTHS!

    bind_to_vao(shader, name, vao) {
        if (!shader || !vao || typeof name !== 'string' || name.trim() === '' || !shader.attributes[name]) {
            console.warn(`Invalid arguments at Buffer.bind_to_vao(): ${shader}, ${vao}, ${name}`);
            return;
        }
        const location = shader.attributes[name];
        this.engine.gl.bindVertexArray(vao);
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.enableVertexAttribArray(location);
        this.engine.gl.vertexAttribPointer(location, this.size, this.type, false, 0, 0);
    }
}

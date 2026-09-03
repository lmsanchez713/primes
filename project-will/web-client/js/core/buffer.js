export class Buffer {
    constructor(engine, type, new_data, usage = engine.gl.STATIC_DRAW, keep_on_ram = false, name = "", preferred_binding_point = 0) {
        this.engine = engine;
        this.type = type;
        this.buffer = this.engine.gl.createBuffer();
        this.data(new_data, usage, keep_on_ram);
        this.name = name;
        this.preferred_binding_point = preferred_binding_point;
    }

    data(new_data, usage = engine.gl.STATIC_DRAW, keep_on_ram = false) {
        this.usage = usage;
        this.keep_on_ram = keep_on_ram;
        this.length = new_data.length ?? new_data;
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.bufferData(this.type, new_data, this.usage);
        if (this.keep_on_ram) {
            this.persistent_data = new Float32Array(this.length);
            if (new_data.length)
                this.persistent_data.set(new_data);
        }
    }

    add_data(new_data, usage = engine.gl.DYNAMIC_DRAW) {
        if (!this.keep_on_ram) {
            console.warn('Calling Buffer.add_data() on a buffer that is not kept on RAM is not supported.');
            return;
        }
        this.data(new Float32Array([...this.persistent_data, ...new_data]), usage, this.keep_on_ram);
    }

    subdata(data, offset = 0, src_offset = 0, length = data.length - src_offset) {
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.bufferSubData(this.type, offset, data, src_offset, length);
        if (this.keep_on_ram) {
            this.persistent_data.set(data.subarray(src_offset / 4, (src_offset + length) / 4), offset / 4);
        }
    } // TO-DO: add error checking for subdata -- CHECK LENGTHS!

    free_from_ram() {
        if (this.keep_on_ram) {
            this.persistent_data = null;
            this.keep_on_ram = false;
        }
    }

    bind() {
        this.engine.gl.bindBuffer(this.type, this.buffer);
    }

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

    bind_base(shader, index, name) {
        if (this.type !== this.engine.gl.UNIFORM_BUFFER) {
            console.warn('bind_base() is only supported for uniform buffers.');
            return;
        }
        if (!name) name = this.name;
        index = index ?? this.preferred_binding_point;
        const blockIndex = this.engine.gl.getUniformBlockIndex(shader.program, name);
        this.engine.gl.uniformBlockBinding(shader.program, blockIndex, index);
        this.engine.gl.bindBufferBase(this.type, index, this.buffer);
    }
}

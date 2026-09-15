export class Buffer {
    constructor(engine, type, new_data, usage = engine.gl.STATIC_DRAW, keep_on_ram = false, name = "", preferred_binding_point = 0) {
        this.engine = engine;
        this.type = type;
        this.buffer = this.engine.gl.createBuffer();
        this.name = name;
        this.preferred_binding_point = preferred_binding_point;
        this.dirty_ranges = [];
        this.data(new_data, usage, keep_on_ram);
    }

    data(new_data, usage = engine.gl.STATIC_DRAW, keep_on_ram = false) {
        this.usage = usage;
        this.keep_on_ram = keep_on_ram;
        this.length = new_data.length ?? new_data;
        this.engine.gl.bindBuffer(this.type, this.buffer);
        this.engine.gl.bufferData(this.type, new_data, this.usage);
        if (this.keep_on_ram) {
            if (new_data instanceof Float32Array) {
                this.persistent_data = new_data;
            } else {
                this.persistent_data = new Float32Array(this.length);
                if (new_data.length)
                    this.persistent_data.set(new_data);
            }
        }
        this.dirty_ranges = [];
    }

    add_data(new_data, usage = engine.gl.DYNAMIC_DRAW) {
        if (!this.keep_on_ram) {
            console.warn('Calling Buffer.add_data() on a buffer that is not kept on RAM is not supported.');
            return;
        }
        this.data(new Float32Array([...this.persistent_data, ...new_data]), usage, this.keep_on_ram);
    }

    subdata(data, offset = 0, src_offset = 0, length = data.length - src_offset) {
        if (!this.keep_on_ram) {
            this.engine.gl.bindBuffer(this.type, this.buffer);
            this.engine.gl.bufferSubData(this.type, offset, data, src_offset, length);
        } else {
            this.persistent_data.set(data.subarray(src_offset, src_offset + length), offset / 4);
            this.mark_dirty(offset / 4, length);
        }
    }

    mark_dirty(offset_idx, count) {
        this.dirty_ranges.push([offset_idx, offset_idx + count]);
    }

    flush() {
        if (this.dirty_ranges.length === 0) return this;

        this.dirty_ranges.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const range of this.dirty_ranges) {
            const last = merged[merged.length - 1];
            if (last && range[0] <= last[1]) {
                last[1] = Math.max(last[1], range[1]);
            } else {
                merged.push(range);
            }
        }
        this.dirty_ranges = [];

        this.engine.gl.bindBuffer(this.type, this.buffer);
        for (const [start_idx, end_idx] of merged) {
            const offset_bytes = start_idx * 4;
            const count = end_idx - start_idx;
            this.engine.gl.bufferSubData(this.type, offset_bytes, this.persistent_data, start_idx, count);
        }
        return this;
    }

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

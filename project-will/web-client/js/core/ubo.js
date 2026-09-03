import { Buffer } from './buffer.js';

// std140 sizes/alignments in units of 4-byte floats
const GLSL_TYPE_INFO = {
    float: { size: 1, align: 1 },
    int: { size: 1, align: 1 },
    uint: { size: 1, align: 1 },
    vec2: { size: 2, align: 2 },
    vec3: { size: 4, align: 4 },
    vec4: { size: 4, align: 4 },
    mat2: { size: 8, align: 4 },
    mat3: { size: 12, align: 4 },
    mat4: { size: 16, align: 4 },
};

const alignUp = (value, alignment) => (value + alignment - 1) & ~(alignment - 1);

/**
 * Uniform buffer object with a declared schema: std140 layout is computed
 * automatically, fields are addressed by name, uploads are batched.
 *
 *   const ubo = new UniformBuffer(engine, 'UBO', [
 *       { name: 'u_modelMatrix', type: 'mat4' },
 *       { name: 'u_ambientLight', type: 'vec4' },
 *       { name: 'u_pointLight', type: 'vec4', count: 32 },
 *       { name: 'u_pointLightCount', type: 'uint' },
 *       { name: 'u_time', type: 'float' },
 *   ]);
 *
 *   ubo.bind_base(shader);                                        // each frame
 *   ubo.set('u_time', engine.time.current);                       // scalar, uploads immediately
 *   ubo.set('u_ambientLight', [0.3, 0.3, 0.3, 1.0]);             // vec from array
 *   ubo.set('u_pointLight', [1.0, 1.0, 1.0, 25.0], 1);           // element 1 of an array field
 *   ubo.set_many({ u_modelMatrix: mat, u_pointLightCount: 2 });   // batch -> single upload
 */
export class UniformBuffer {
    /**
     * @param {object} engine
     * @param {string} name - must match the GLSL uniform block name
     * @param {Array<{name: string, type: string, count?: number}>} fields
     * @param {number} [usage]
     * @param {number} [binding_point]
     */
    constructor(engine, name, fields, usage = engine.gl.DYNAMIC_DRAW, binding_point = 0) {
        this.engine = engine;
        this.name = name;
        this.binding_point = binding_point;
        this.fields = {};
        this.float_count = 0;

        for (const field of fields) {
            const info = GLSL_TYPE_INFO[field.type];
            if (!info) {
                throw new Error(`UniformBuffer '${name}': unknown GLSL type '${field.type}' for field '${field.name}'.`);
            }
            const count = field.count ?? 1;
            const offset = alignUp(this.float_count, info.align);
            this.fields[field.name] = { name: field.name, type: field.type, size: info.size, count, offset };
            this.float_count = offset + info.size * count;
        }

        // std140: total block size is a multiple of 16 bytes (4 floats)
        this.float_count = alignUp(this.float_count, 4);
        this.data = new Float32Array(this.float_count);
        this.buffer = new Buffer(engine, engine.gl.UNIFORM_BUFFER, this.data, usage, false, name, binding_point);
        this.dirty = [];
    }

    /** Total buffer size in bytes. */
    get byte_size() { return this.float_count * 4; }

    /** Byte offset of a field (or of an array element when index given). */
    offset_bytes(name, index = 0) {
        const field = this.fields[name];
        return field ? (field.offset + index * field.size) * 4 : -1;
    }

    /** Bind this UBO to the shader's uniform block (call each frame before drawing). */
    bind_base(shader) {
        return this.buffer.bind_base(shader, this.binding_point, this.name);
    }

    /** Write one field (or one array element) and upload it right away. */
    set(name, value, index = null) {
        const range = this._write(name, value, index);
        if (range) this.dirty.push(range);
        return this.flush();
    }

    /** Write several fields at once, uploaded with a single (merged) transfer. */
    set_many(values) {
        for (const [name, value] of Object.entries(values)) {
            const range = this._write(name, value, null);
            if (range) this.dirty.push(range);
        }
        return this.flush();
    }

    /** Upload all pending writes, merged into the minimum number of sub-uploads. */
    flush() {
        if (this.dirty.length === 0) return this;
        this.dirty.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const range of this.dirty) {
            const last = merged[merged.length - 1];
            if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
            else merged.push([range[0], range[1]]);
        }
        this.dirty = [];
        for (const [start, end] of merged) {
            this.buffer.subdata(this.data, start * 4, start, (end - start));
        }
        return this;
    }

    /** Zero the whole buffer and upload. */
    clear() {
        this.data.fill(0);
        this.dirty.push([0, this.float_count]);
        return this.flush();
    }

    // -- internals ---------------------------------------------------------

    _write(name, value, index = null) {
        const field = this.fields[name];
        if (!field) {
            console.warn(`UniformBuffer '${this.name}': unknown field '${name}'.`);
            return null;
        }
        let offset = field.offset, size = field.size;
        if (field.count > 1) {
            if (index === null) {
                size *= field.count;
            } else {
                if (!Number.isInteger(index) || index < 0 || index >= field.count) {
                    console.warn(`UniformBuffer '${this.name}': index ${index} out of range for '${name}' (0..${field.count - 1}).`);
                    return null;
                }
                offset += index * field.size;
            }
        }
        this._copy(field, value, offset, size);
        return [offset, offset + size];
    }

    _copy(field, value, offset, size) {
        const d = this.data;
        if (typeof value === 'number') {
            if (size > 1) console.warn(`UniformBuffer '${this.name}': scalar assigned to '${field.name}' - only the first float is written.`);
            d[offset] = value;
            return;
        }
        if (value === null || typeof value !== 'object') {
            console.warn(`UniformBuffer '${this.name}': cannot assign a ${typeof value} to '${field.name}'.`);
            return;
        }
        if (value.data !== undefined && value.data.length >= size) {
            // Mat4-style object with a flat .data array (column-major)
            if (value.data instanceof Float32Array) d.set(value.data.subarray(0, size), offset);
            else for (let i = 0; i < size; i++) d[offset + i] = value.data[i];
            return;
        }
        if (typeof value.length === 'number') {
            // JS array / typed array
            if (value.length < size) console.warn(`UniformBuffer '${this.name}': ${value.length} values assigned to '${field.name}', expected ${size}.`);
            for (let i = 0; i < Math.min(value.length, size); i++) d[offset + i] = value[i];
            return;
        }
        if (value.x !== undefined) {
            // Vec2 / Vec3 / Vec4
            let i = 0;
            for (const key of ['x', 'y', 'z', 'w']) {
                if (i >= size || value[key] === undefined) break;
                d[offset + i++] = value[key];
            }
            return;
        }
        console.warn(`UniformBuffer '${this.name}': cannot assign ${value.constructor?.name ?? 'unknown'} to '${field.name}'.`);
    }
}

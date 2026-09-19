import { Buffer } from './buffer.js';
import { vertex_array_object } from './vao.js';

class Draw_Interval {
    constructor(engine, offset, count, mode = engine.gl.TRIANGLES) {
        this.offset = offset;
        this.count = count;
        this.mode = mode;
    }
}

export class Geometry {
    constructor(engine, vertex_data = {}, keep_on_ram = false) {
        this.engine = engine;
        this.buffers = {};
        this.shaders = {};
        this.objects = {};
        this.keep_on_ram = keep_on_ram;
        if (!vertex_data || Object.keys(vertex_data).length <= 0) {
            vertex_data = {
                aPosition: { data: null, size: 3 },
                aTexCoord: { data: null, size: 2 },
                aNormal: { data: null, size: 3 }
            };
        }
        if (vertex_data && Object.keys(vertex_data).length > 0) {
            for (const [attribute_name, attribute_data] of Object.entries(vertex_data)) {
                const { data, size, type = this.engine.gl.FLOAT, usage = this.engine.gl.STATIC_DRAW, buffer_type = this.engine.gl.ARRAY_BUFFER } = attribute_data;
                this.addBuffer(attribute_name, data, size, type, usage, buffer_type);
            }
        }
    }

    get_vertex_count(attribute_name = "aPosition") {
        const buffer_entry = this.buffers[attribute_name];
        if (!buffer_entry) {
            console.warn(`Buffer ${attribute_name} not found in geometry.`);
            return 0;
        }
        return buffer_entry.buffer.length / buffer_entry.size;
    }

    addShader(name, shader) {
        const vao = new vertex_array_object(this.engine, shader);
        this.shaders[name] = vao;
        return vao;
    }

    bind(shader_name) {
        const vao = this.shaders[shader_name];
        if (!vao) {
            console.warn(`Shader ${shader_name} not found in geometry.`);
            return;
        }
        vao.bind();
    }

    addBuffer(name, data, size, type = this.engine.gl.FLOAT,
        usage = this.engine.gl.STATIC_DRAW, buffer_type = this.engine.gl.ARRAY_BUFFER) {
        this.buffers[name] = { buffer: new Buffer(this.engine, buffer_type, data, usage, this.keep_on_ram), size, type };
    }

    add_buffer_data(attribute_data_object, usage = this.engine.gl.DYNAMIC_DRAW) {
        for (const [attribute_name, buffer_data] of Object.entries(attribute_data_object)) {
            if (!Object.hasOwn(this.buffers, attribute_name)) {
                console.warn(`Buffer ${attribute_name} not found in geometry.`);
                continue;
            }
            const buffer_entry = this.buffers[attribute_name];
            buffer_entry.buffer.add_data(buffer_data, usage);
        }
    }

    buffer_sub_data(attribute_subdata_object) {
        for (const [attribute_name, subdata_entry] of Object.entries(attribute_subdata_object)) {
            if (!Object.hasOwn(this.buffers, attribute_name)) {
                console.warn(`Buffer ${attribute_name} not found in geometry.`);
                continue;
            }
            const buffer_entry = this.buffers[attribute_name];
            buffer_entry.buffer.subdata(subdata_entry.data, subdata_entry.offset);
        }
    }

    flush() {
        for (const buffer_entry of Object.values(this.buffers)) {
            buffer_entry.buffer.flush();
        }
    }

    free_from_ram() {
        for (const buffer_entry of Object.values(this.buffers)) {
            buffer_entry.buffer.free_from_ram();
        }
    }

    updateBindings() {
        for (const vao of Object.values(this.shaders)) {
            vao.bind();
            vao.setup_attributes(this.buffers);
        }
    }

    addObject(name, offset, count, mode = this.engine.gl.TRIANGLES) {
        this.objects[name] = new Draw_Interval(this.engine, offset, count, mode);
    }

    drawObject(name) {
        const obj = this.objects[name];
        if (!obj) {
            console.warn(`Object ${name} not found in geometry.`);
            return;
        }
        this.engine.gl.drawArrays(obj.mode, obj.offset, obj.count);
    }

    generate_triangle(x0, y0, z0, u0, v0, x1, y1, z1, u1, v1, x2, y2, z2, u2, v2, flush = false) {
        const position = new Float32Array([x0, y0, z0, x1, y1, z1, x2, y2, z2]);
        const texture = new Float32Array([u0, v0, u1, v1, u2, v2]);
        const normal = new Float32Array(9);

        // 1. Calcular os vetores v01 (de P0 para P1) e v02 (de P0 para P2)
        const v01x = x1 - x0;
        const v01y = y1 - y0;
        const v01z = z1 - z0;

        const v02x = x2 - x0;
        const v02y = y2 - y0;
        const v02z = z2 - z0;

        // 2. Calcular o produto cruzado (Cross Product) -> Vetor Perpendicular
        const nx = (v01y * v02z) - (v01z * v02y);
        const ny = (v01z * v02x) - (v01x * v02z);
        const nz = (v01x * v02y) - (v01y * v02x);

        // 3. Calcular o comprimento do vetor para normalizar
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

        // Evitar divisão por zero caso os pontos estejam alinhados ou sobrepostos
        if (length === 0) {
            normal.set([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
        }

        // 4. Retornar o vetor normal unitário
        const nlzd_x = nx / length,
            nlzd_y = ny / length,
            nlzd_z = nz / length;

        normal.set([nlzd_x, nlzd_y, nlzd_z, nlzd_x, nlzd_y, nlzd_z, nlzd_x, nlzd_y, nlzd_z]);
        
        this.add_buffer_data({
            aPosition: position,
            aNormal: normal,
            aTexCoord: texture
        });

        if (flush) this.flush();
    }
}

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
        if (vertex_data && Object.keys(vertex_data).length > 0) {
            for (const [attribute_name, attribute_data] of Object.entries(vertex_data)) {
                const { data, size, type = this.engine.gl.FLOAT, usage = this.engine.gl.STATIC_DRAW, buffer_type = this.engine.gl.ARRAY_BUFFER } = attribute_data;
                this.addBuffer(attribute_name, data, size, type, usage, buffer_type);
            }
        }
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
}

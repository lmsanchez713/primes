import { Buffer } from './buffer.js';

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

    addAttribute(buffer, location, size, type = this.engine.gl.FLOAT) {
        this.engine.gl.bindVertexArray(this.vao.vao);
        this.engine.gl.bindBuffer(this.engine.gl.ARRAY_BUFFER, buffer.buffer);
        this.engine.gl.enableVertexAttribArray(location);
        this.engine.gl.vertexAttribPointer(location, size, type, false, 0, 0);
        this.buffers.push(buffer);
    }

    updateBufferBindings(name) {
        if (Object.hasOwn(this.buffers, name)) {
            const buffer = this.buffers[name];
            for (const shader of this.shaders.values()) {
                if (Object.hasOwn(shader.attributes, name)) {
                    const location = shader.attributes[name];
                    this.engine.gl.bindVertexArray(shader.vao);
                    this.engine.gl.bindBuffer(buffer.type, buffer.buffer);
                    this.engine.gl.enableVertexAttribArray(location);
                    this.engine.gl.vertexAttribPointer(location, buffer.size, buffer.type, false, 0, 0);
                }
            }
        }
        //also update uniform buffer bindings here
    }

    addShader(name, shader) {
        this.shaders[name] = { shader, vao: this.engine.gl.createVertexArray() };
    }

    bind(shader_name) {
        const shader_vao_pair = this.shaders[shader_name];
        if (!shader_vao_pair) {
            console.warn(`Shader ${shader_name} not found in geometry.`);
            return;
        }
        this.engine.gl.useProgram(shader_vao_pair.shader.program);
        this.engine.gl.bindVertexArray(shader_vao_pair.vao);
    }

    addBuffer(name, data, size, type = this.engine.gl.FLOAT,
        usage = this.engine.gl.STATIC_DRAW, buffer_type = this.engine.gl.ARRAY_BUFFER) {
        const buffer_entry = this.buffers[name]
            = { buffer: new Buffer(this.engine, buffer_type, data, usage, this.keep_on_ram), size, type };
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

    buffer_sub_data(attribute_subdata_object) {//, offset = 0, src_offset = 0, length = data.length - src_offset) {
        for (const [attribute_name, subdata_entry] of Object.entries(attribute_subdata_object)) {
            if (!Object.hasOwn(this.buffers, attribute_name)) {
                console.warn(`Buffer ${attribute_name} not found in geometry.`);
                continue;
            }
            const buffer_entry = this.buffers[attribute_name];
            buffer_entry.buffer.subdata(subdata_entry.data, subdata_entry.offset);//, src_offset, length);
        }
    } // TO-DO: add error checking for subdata -- CHECK LENGTHS!

    free_from_ram() {
        for (const buffer_entry of Object.values(this.buffers)) {
            buffer_entry.buffer.free_from_ram();
        }
    }

    updateBindings() {
        for (const [shader_name, shader_vao_pair] of Object.entries(this.shaders)) {
            const shader = shader_vao_pair.shader;
            this.engine.gl.useProgram(shader.program);
            this.engine.gl.bindVertexArray(shader_vao_pair.vao);
            for (const [attribute_name, attribute_location] of Object.entries(shader.attributes)) {
                if (!Object.hasOwn(this.buffers, attribute_name)) {
                    console.warn(`Buffer ${attribute_name} not found in geometry for shader ${shader_name}.`);
                    continue;
                }
                const buffer_entry = this.buffers[attribute_name];
                this.engine.gl.bindBuffer(buffer_entry.buffer.type, buffer_entry.buffer.buffer);
                this.engine.gl.enableVertexAttribArray(attribute_location);
                this.engine.gl.vertexAttribPointer(attribute_location, buffer_entry.size, buffer_entry.type, false, 0, 0);
            }
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
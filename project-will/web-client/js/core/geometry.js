import { Buffer } from './buffer.js';

class Draw_Interval {
    constructor(engine, offset, count, mode = engine.gl.TRIANGLES) {
        this.offset = offset;
        this.count = count;
        this.mode = mode;
    }
}

export class Geometry {
    constructor(engine) {
        this.engine = engine;
        this.buffers = {};
        this.shaders = {};
        this.objects = {};
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
        this.buffers[name] = { buffer: new Buffer(this.engine, buffer_type, data, usage), size, type };
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

export function createSquareGeometry(engine) {
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

    const geo = new Geometry(engine, engine.gl.TRIANGLES);
    geo.addBuffer('aPosition', vertices, 3);
    geo.addBuffer('aTexCoord', texCoords, 2);
    geo.addBuffer('aNormal', normals, 3);

    return geo;
}
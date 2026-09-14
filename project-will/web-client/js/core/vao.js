export class vertex_array_object {
    constructor(engine, shader) {
        this.engine = engine;
        this.shader = shader;
        this.vao = engine.gl.createVertexArray();
        this.static_attributes = new Map();
    }

    set_static_attribute(name, value) {
        this.static_attributes.set(name, value);
    }

    remove_static_attribute(name) {
        this.static_attributes.delete(name);
    }

    bind() {
        this.engine.gl.useProgram(this.shader.program);
        this.engine.gl.bindVertexArray(this.vao);
    }

    setup_attributes(buffers) {
        this.engine.gl.bindVertexArray(this.vao);
        for (const [attribute_name, attribute_location] of Object.entries(this.shader.attributes)) {
            if (attribute_location === -1) continue;

            // 1. Priority: Static attribute
            if (this.static_attributes.has(attribute_name)) {
                const val = this.static_attributes.get(attribute_name);
                this.engine.gl.enableVertexAttribArray(attribute_location);
                
                const values = Array.isArray(val) ? val : [val];
                const len = values.length;
                
                if (len === 1) this.engine.gl.vertexAttrib1f(attribute_location, ...values);
                else if (len === 2) this.engine.gl.vertexAttrib2f(attribute_location, ...values);
                else if (len === 3) this.engine.gl.vertexAttrib3f(attribute_location, ...values);
                else if (len === 4) this.engine.gl.vertexAttrib4f(attribute_location, ...values);
                continue;
            }

            // 2. Buffer data
            const buffer_entry = buffers[attribute_name];
            if (buffer_entry) {
                this.engine.gl.bindBuffer(buffer_entry.buffer.type, buffer_entry.buffer.buffer);
                this.engine.gl.enableVertexAttribArray(attribute_location);
                this.engine.gl.vertexAttribPointer(attribute_location, buffer_entry.size, buffer_entry.type, false, 0, 0);
            } else {
                // 3. Fallback: Disable attribute
                this.engine.gl.disableVertexAttribArray(attribute_location);
            }
        }
    }
}

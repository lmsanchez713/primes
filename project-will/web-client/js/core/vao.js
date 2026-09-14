export class vertex_array_object {
    constructor(engine, shader) {
        this.engine = engine;
        this.shader = shader;
        this.vao = engine.gl.createVertexArray();
    }

    bind() {
        this.engine.gl.useProgram(this.shader.program);
        this.engine.gl.bindVertexArray(this.vao);
    }

    setup_attributes(buffers) {
        this.engine.gl.bindVertexArray(this.vao);
        for (const [attribute_name, attribute_location] of Object.entries(this.shader.attributes)) {
            const buffer_entry = buffers[attribute_name];
            if (!buffer_entry) {
                console.warn(`Buffer ${attribute_name} not found in geometry for shader.`);
                continue;
            }
            this.engine.gl.bindBuffer(buffer_entry.buffer.type, buffer_entry.buffer.buffer);
            this.engine.gl.enableVertexAttribArray(attribute_location);
            this.engine.gl.vertexAttribPointer(attribute_location, buffer_entry.size, buffer_entry.type, false, 0, 0);
        }
    }
}

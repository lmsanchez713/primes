export class Shader {
    constructor(gl, vsSource, fsSource) {
        this.gl = gl;
        this.program = this._initProgram(vsSource, fsSource);
    }

    _initShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    _initProgram(vsSource, fsSource) {
        const vs = this._initShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
        const fs = this._initShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return null;

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
}

export class Buffer {
    constructor(gl, type, data) {
        this.gl = gl;
        this.type = type;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(this.type, this.buffer);
        gl.bufferData(this.type, data, gl.STATIC_DRAW);
    }

    bind() {
        this.gl.bindBuffer(this.type, this.buffer);
    }
}

export class Texture {
    constructor(gl, url) {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.isReady = false;
        this._load(url);
    }

    _load(url) {
        const gl = this.gl;
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.isReady = true;
        };
        image.src = url;
    }

    bind(unit = 0) {
        if (!this.isReady) return;
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    }
}

/**
 * VertexArray handles the WebGL2 Vertex Array Object (VAO).
 * It acts as a "state container" for vertex attributes.
 */
export class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
    }

    bind() {
        this.gl.bindVertexArray(this.vao);
    }

    unbind() {
        this.gl.bindVertexArray(null);
    }
}

/**
 * Geometry defines the "shape" of an object.
 * It manages the VertexArray and the Buffers that define the mesh.
 */
export class Geometry {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {number} mode - The WebGL draw mode (e.g., gl.TRIANGLES, gl.TRIANGLE_STRIP)
     */
    constructor(gl, mode = gl.TRIANGLES) {
        this.gl = gl;
        this.mode = mode;
        this.count = 0; // Number of vertices to draw

        this.vao = new VertexArray(gl);
        this.buffers = []; // Keep references to buffers to prevent garbage collection
    }

    /**
     * Adds a buffer to the geometry and configures its attribute in the VAO.
     * @param {Buffer} buffer - The Buffer instance from ogl2.js
     * @param {number} location - The attribute location (from gl.getAttribLocation)
     * @param {number} size - Number of components (e.g., 2 for vec2, 3 for vec3)
     * @param {number} type - Data type (usually gl.FLOAT)
     */
    addAttribute(buffer, location, size, type = this.gl.FLOAT) {
        this.vao.bind();

        // 1. Bind the actual WebGL buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.buffer);

        // 2. Enable the attribute in the VAO
        this.gl.enableVertexAttribArray(location);

        // 3. Tell WebGL how to interpret the data in the buffer
        this.gl.vertexAttribPointer(location, size, type, false, 0, 0);

        // 4. Store the buffer so it isn't garbage collected
        this.buffers.push(buffer);
    }

    /**
     * Sets the number of vertices to be drawn.
     * This should be called after all attributes are added.
     * @param {number} count - The number of vertices to draw.
     */
    setCount(count) {
        this.count = count;
    }

    /**
     * Prepares the GPU state to draw this specific geometry.
     */
    bind() {
        this.vao.bind();
    }

    /**
     * Executes the draw call.
     */
    draw() {
        if (this.count === 0) {
            console.warn("Geometry: Attempted to draw geometry with count 0.");
            return;
        }
        this.gl.drawArrays(this.mode, 0, this.count);
    }
}

export class Material {
    constructor(gl, shader) {
        this.gl = gl;
        this.shader = shader;

        // We store textures as an array of objects: { name, texture, unit }
        this.textures = [];

        // We store other uniforms (like floats, vecs) in a Map
        this.uniforms = new Map();
    }

    /**
     * Associates a Texture object with a uniform name in the shader.
     * @param {string} name - The name of the sampler2D uniform in the GLSL code.
     * @param {Texture} textureInstance - The Texture object from ogl2.js
     */
    setTexture(name, textureInstance) {
        const existingIndex = this.textures.findIndex(t => t.name === name);

        if (existingIndex !== -1) {
            this.textures[existingIndex].texture = textureInstance;
        } else {
            this.textures.push({
                name: name,
                texture: textureInstance
            });
        }
    }

    /**
     * Sets a standard uniform (float, vec2, vec3, etc.)
     * @param {string} name - The name of the uniform in the GLSL code.
     * @param {any} value - The value to set.
     */
    setUniform(name, value) {
        this.uniforms.set(name, value);
    }

    /**
     * The most important method: called right before the draw call.
     * It activates the shader and binds all textures and uniforms.
     */
    apply() {
        const gl = this.gl;

        // 1. Use the shader program
        gl.useProgram(this.shader.program);

        // 2. Bind all textures to unique units
        this.textures.forEach((texData, index) => {
            const unit = index;
            texData.texture.bind(unit);
            const loc = gl.getUniformLocation(this.shader.program, texData.name);
            if (loc) {
                gl.uniform1i(loc, unit);
            }
        });

        // 3. Apply all other uniforms
        this.uniforms.forEach((value, name) => {
            const loc = gl.getUniformLocation(this.shader.program, name);
            if (!loc) return;

            // Check if value is a number or an array/typed array
            if (Array.isArray(value) || ArrayBuffer.isView(value)) {
                if (value.length === 1) {
                    gl.uniform1fv(loc, value);
                } else if (value.length === 2) {
                    gl.uniform2fv(loc, value);
                } else if (value.length === 3) {
                    gl.uniform3fv(loc, value);
                } else if (value.length === 4) {
                    gl.uniform4fv(loc, value);
                } else if (value.length === 9) {
                    gl.uniformMatrix3fv(loc, false, value);
                } else if (value.length === 16) {
                    gl.uniformMatrix4fv(loc, false, value);
                }
            } else {
                // Assume single float value
                gl.uniform1f(loc, value);
            }
        });
    }
}

export class Entity {
    constructor(geometry, material) {
        this.geometry = geometry; // The shape
        this.material = material; // The look
        this.position = { x: 0, y: 0, z: 0 };
    }

    draw(gl) {
        this.material.apply();
        this.geometry.bind();
        this.geometry.draw();
    }
}

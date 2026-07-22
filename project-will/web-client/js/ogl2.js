import { Mat4 } from './math.js';

export class Shader {
    constructor(gl, vsSource, fsSource) {
        this.gl = gl;
        this.program = this._initProgram(vsSource, fsSource);
        this.uniformLocations = new Map();
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

    getUniformLocation(name) {
        if (!this.uniformLocations.has(name)) {
            this.uniformLocations.set(name, this.gl.getUniformLocation(this.program, name));
        }
        return this.uniformLocations.get(name);
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

export class Geometry {
    constructor(gl, mode = gl.TRIANGLES) {
        this.gl = gl;
        this.mode = mode;
        this.count = 0;
        this.vao = new VertexArray(gl);
        this.buffers = [];
    }

    addAttribute(buffer, location, size, type = this.gl.FLOAT) {
        this.vao.bind();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.buffer);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, type, false, 0, 0);
        this.buffers.push(buffer);
    }

    setCount(count) {
        this.count = count;
    }

    bind() {
        this.vao.bind();
    }

    draw() {
        if (this.count === 0) return;
        this.gl.drawArrays(this.mode, 0, this.count);
    }
}

export class Material {
    constructor(gl, shader) {
        this.gl = gl;
        this.shader = shader;
        this.textures = [];
        this.uniforms = new Map();
    }

    setTexture(name, textureInstance) {
        const existingIndex = this.textures.findIndex(t => t.name === name);
        if (existingIndex !== -1) {
            this.textures[existingIndex].texture = textureInstance;
        } else {
            this.textures.push({ name: name, texture: textureInstance });
        }
    }

    setUniform(name, value) {
        this.uniforms.set(name, value);
    }

    apply() {
        const gl = this.gl;
        gl.useProgram(this.shader.program);

        this.textures.forEach((texData, index) => {
            const unit = index;
            texData.texture.bind(unit);
            const loc = this.shader.getUniformLocation(texData.name);
            if (loc) gl.uniform1i(loc, unit);
        });

        this.uniforms.forEach((value, name) => {
            const loc = this.shader.getUniformLocation(name);
            if (!loc) return;

            let data = value;
            // Handle Mat4 objects by extracting their data property
            if (value && value.data && (ArrayBuffer.isView(value.data) || Array.isArray(value.data))) {
                data = value.data;
            }

            if (Array.isArray(data) || ArrayBuffer.isView(data)) {
                if (data.length === 1) gl.uniform1fv(loc, data);
                else if (data.length === 2) gl.uniform2fv(loc, data);
                else if (data.length === 3) gl.uniform3fv(loc, data);
                else if (data.length === 4) gl.uniform4fv(loc, data);
                else if (data.length === 9) gl.uniformMatrix3fv(loc, false, data);
                else if (data.length === 16) gl.uniformMatrix4fv(loc, false, data);
            } else {
                gl.uniform1f(loc, data);
            }
        });
    }
}

export class Entity {
    constructor(geometry = null, material = null) {
        this.geometry = geometry;
        this.material = material;
        this.transform = new Mat4();
        this.parent = null;
        this.children = [];
    }

    add(child) {
        if (child.parent) {
            child.parent.remove(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    remove(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    render(gl, parentWorldMatrix) {
        const worldMatrix = Mat4.multiply(parentWorldMatrix, this.transform);

        this.pre_render(gl);

        if (this.geometry && this.material) {
            this.material.apply();
            this.material.setUniform('u_modelMatrix', worldMatrix);
            this.geometry.bind();
            this.geometry.draw();
        }

        for (const child of this.children) {
            child.render(gl, worldMatrix);
        }

        this.post_render(gl);
    }

    pre_render(gl) {}
    post_render(gl) {}
}

export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.root = new Entity();
    }

    add(entity) {
        this.root.add(entity);
    }

    render() {
        const gl = this.gl;
        const identity = new Mat4(); 
        this.root.render(gl, identity);
    }
}

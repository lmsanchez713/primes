import { Shader } from './shader.js';

export class Material {
    constructor(gl, shader) {
        this.gl = gl;
        this.shader = shader;
        this.textures = [];
        this.uniforms = new Map();
    }

    setTexture(name, textureOrUrl) {
        const existingIndex = this.textures.findIndex(t => t.name === name);
        if (existingIndex !== -1) {
            if (typeof textureOrUrl === 'string') {
                this.textures[existingIndex].url = textureOrUrl;
                this.textures[existingIndex].texture = null;
            } else {
                this.textures[existingIndex].texture = textureOrUrl;
                this.textures[existingIndex].url = null;
            }
        } else {
            if (typeof textureOrUrl === 'string') {
                this.textures.push({ name: name, texture: null, url: textureOrUrl });
            } else {
                this.textures.push({ name: name, texture: textureOrUrl, url: null });
            }
        }
    }

    setUniform(name, value) {
        this.uniforms.set(name, value);
    }

    isReady() {
        return true;
    }

    apply(engine) {
        const gl = this.gl;
        gl.useProgram(this.shader.program);

        this.textures.forEach((texData, index) => {
            const unit = index;

            // Lazy load texture if we have a URL and it hasn't been loaded yet
            if (texData.url) {
                const url = texData.url;
                texData.url = null; // Ensure we only trigger load once
                engine.assets.loadTexture(gl, url).then(texture => {
                    texData.texture = texture;
                });
            }

            if (texData.texture) {
                texData.texture.bind(unit);
                const loc = this.shader.getUniformLocation(texData.name);
                if (loc) gl.uniform1i(loc, unit);
            }
        });

        this.uniforms.forEach((value, name) => {
            const loc = this.shader.getUniformLocation(name);
            if (!loc) return;

            let data = value;
            if (value && value.data && (ArrayBuffer.isView(value.data) || Array.isArray(value.data))) {
                data = value.data;
            }

            if (typeof data === 'number' && Number.isInteger(data)) {
                gl.uniform1i(loc, data);
            } else if (Array.isArray(data) || ArrayBuffer.isView(data)) {
                const len = data.length;
                if (len === 1) gl.uniform1fv(loc, data);
                else if (len === 2) gl.uniform2fv(loc, data);
                else if (len === 3) gl.uniform3fv(loc, data);
                else if (len === 4) gl.uniform4fv(loc, data);
                else if (len === 9) gl.uniformMatrix3fv(loc, false, data);
                else if (len === 16) gl.uniformMatrix4fv(loc, false, data);
            } else {
                gl.uniform1f(loc, data);
            }
        });
    }
}

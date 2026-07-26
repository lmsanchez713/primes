import { Shader } from './shader.js';

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

    isReady() {
        return true;
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

    isReady() {
        return true;
    }
}

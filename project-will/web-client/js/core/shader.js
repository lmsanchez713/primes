export const LightType = {
    AMBIENT: 'ambient',
    DIRECTIONAL: 'directional',
    POINT: 'point'
};

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

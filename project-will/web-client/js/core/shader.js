//export const LightType = {
//    AMBIENT: 'ambient',
//    DIRECTIONAL: 'directional',
//    POINT: 'point'
//};

export class Shader {
    constructor(engine, vsSource, fsSource, attributes, uniforms, uniform_blocks) {
        this.engine = engine;
        this.program = this._initProgram(vsSource, fsSource);
        this.attributes = {};
        for (const name of attributes) {
            this.attributes[name] = this.engine.gl.getAttribLocation(this.program, name);
        }
        this.uniforms = {};
        for (const name of uniforms) {
            this.uniforms[name] = this.engine.gl.getUniformLocation(this.program, name);
        }
        this.ubos = {};
        for (const name of uniform_blocks) {
            this.ubos[name] = this.engine.gl.getUniformBlockIndex(this.program, name);
        }
    }

    bind_ubo(ubo_name, binding_point) {
        const blockIndex = this.ubos[ubo_name];
        if (blockIndex === this.engine.gl.INVALID_INDEX) {
            console.warn(`Uniform block ${ubo_name} not found in shader.`);
            return;
        }
        this.engine.gl.uniformBlockBinding(this.program, blockIndex, binding_point);
    }

    uniform1i(name, value) {
        const location = this.uniforms[name] ?? null;
        if (location === null) {
            console.warn(`Uniform ${name} not found in shader.`);
            return;
        }
        this.engine.gl.uniform1i(location, value);
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
        const vs = this._initShader(this.engine.gl, this.engine.gl.VERTEX_SHADER, vsSource);
        const fs = this._initShader(this.engine.gl, this.engine.gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return null;

        const program = this.engine.gl.createProgram();
        this.engine.gl.attachShader(program, vs);
        this.engine.gl.attachShader(program, fs);
        this.engine.gl.linkProgram(program);

        if (!this.engine.gl.getProgramParameter(program, this.engine.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.engine.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

//    /**
//     * Parse UBO information from the shader source
//     * This is a simple parser that looks for uniform block declarations
//     */
//    _parseUBOInfo(vsSource, fsSource) {
//        // In a full implementation, we would parse the shader sources to find 
//        // uniform block declarations and their binding points
//
//        // For now, we just note that this shader uses UBOs
//        this.usesUBOs = true;
//    }
//
//    /**
//     * Sets a uniform block binding point for a UBO
//     * @param {string} blockName - Name of the uniform block
//     * @param {number} bindingPoint - Binding point to use
//     */
//    setUBOBinding(blockName, bindingPoint) {
//        this.uboBindings.set(blockName, bindingPoint);
//        // In WebGL 2, we'd bind the block here using glGetUniformBlockIndex and glUniformBlockBinding
//        // For now, we just track the binding for later use
//    }
//
//    /**
//     * Binds all UBOs that have been set up for this shader
//     * @param {UBOManager} uboManager - The UBO manager instance
//     */
//    bindUBOs(uboManager) {
//        // Bind each uniform block to its specified binding point
//        for (const [blockName, bindingPoint] of this.uboBindings.entries()) {
//            const blockIndex = this.engine.gl.getUniformBlockIndex(this.program, blockName);
//            if (blockIndex !== WebGLRenderingContext.INVALID_INDEX) {
//                this.engine.gl.uniformBlockBinding(this.program, blockIndex, bindingPoint);
//            }
//        }
//
//        // Bind all UBOs to their binding points
//        uboManager.bindAll();
//    }
}

export async function loadShaderFromUrl(gl, vsUrl, fsUrl, attributes, uniforms, uniform_blocks) {
    const vsSource = await (await fetch(vsUrl)).text();
    const fsSource = await (await fetch(fsUrl)).text();
    return new Shader(gl, vsSource, fsSource, attributes, uniforms, uniform_blocks);
}
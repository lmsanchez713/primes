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
        this.uboBindings = new Map(); // Track UBO binding points
        this._parseUBOInfo(vsSource, fsSource);
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

    /**
     * Parse UBO information from the shader source
     * This is a simple parser that looks for uniform block declarations
     */
    _parseUBOInfo(vsSource, fsSource) {
        // In a full implementation, we would parse the shader sources to find 
        // uniform block declarations and their binding points
        
        // For now, we just note that this shader uses UBOs
        this.usesUBOs = true;
    }

    /**
     * Sets a uniform block binding point for a UBO
     * @param {string} blockName - Name of the uniform block
     * @param {number} bindingPoint - Binding point to use
     */
    setUBOBinding(blockName, bindingPoint) {
        this.uboBindings.set(blockName, bindingPoint);
        // In WebGL 2, we'd bind the block here using glGetUniformBlockIndex and glUniformBlockBinding
        // For now, we just track the binding for later use
    }

    /**
     * Binds all UBOs that have been set up for this shader
     * @param {UBOManager} uboManager - The UBO manager instance
     */
    bindUBOs(uboManager) {
        // Bind each uniform block to its specified binding point
        for (const [blockName, bindingPoint] of this.uboBindings.entries()) {
            const blockIndex = this.gl.getUniformBlockIndex(this.program, blockName);
            if (blockIndex !== WebGLRenderingContext.INVALID_INDEX) {
                this.gl.uniformBlockBinding(this.program, blockIndex, bindingPoint);
            }
        }

        // Bind all UBOs to their binding points
        uboManager.bindAll();
    }
}

export async function loadShaderFromUrl(gl, vsUrl, fsUrl) {
    const vsSource = await(await fetch(vsUrl)).text();
    const fsSource = await(await fetch(fsUrl)).text();
    return new Shader(gl, vsSource, fsSource);
}
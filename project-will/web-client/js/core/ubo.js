export class UBOManager {
    constructor(gl) {
        this.gl = gl;
        this.buffers = new Map();
        this.blockBindings = new Map();
        this.nextBindingPoint = 0;
    }

    /**
     * Creates a new uniform buffer object (UBO)
     * @param {string} name - Name of the UBO
     * @param {ArrayBuffer} data - Initial data for the buffer
     * @param {number} usage - GL usage flag (e.g., gl.DYNAMIC_DRAW)
     */
    createUBO(name, data, usage = this.gl.DYNAMIC_DRAW) {
        const ubo = {
            name: name,
            buffer: this.gl.createBuffer(),
            size: data.byteLength,
            bindingPoint: this.nextBindingPoint++,
            usage: usage,
            data: data
        };

        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, ubo.buffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, data, usage);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);

        this.buffers.set(name, ubo);
        return ubo;
    }

    /**
     * Sets the binding point for a UBO
     * @param {string} name - Name of the UBO
     * @param {number} bindingPoint - Binding point to set
     */
    setBindingPoint(name, bindingPoint) {
        const ubo = this.buffers.get(name);
        if (ubo) {
            ubo.bindingPoint = bindingPoint;
            this.blockBindings.set(name, bindingPoint);
        }
    }

    /**
     * Binds a UBO to its binding point
     * @param {string} name - Name of the UBO
     */
    bindUBO(name) {
        const ubo = this.buffers.get(name);
        if (ubo) {
            this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, ubo.bindingPoint, ubo.buffer);
        }
    }

    /**
     * Updates the data in a UBO
     * @param {string} name - Name of the UBO
     * @param {ArrayBuffer} newData - New data to update
     */
    updateUBO(name, newData) {
        const ubo = this.buffers.get(name);
        if (ubo && ubo.data.byteLength === newData.byteLength) {
            ubo.data = newData;
            this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, ubo.buffer);
            this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, newData);
            this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
        }
    }

    /**
     * Gets a UBO by name
     * @param {string} name - Name of the UBO
     * @returns {Object} The UBO object or undefined if not found
     */
    getUBO(name) {
        return this.buffers.get(name);
    }

    /**
     * Binds all UBOs to their binding points
     */
    bindAll() {
        for (const [name, ubo] of this.buffers.entries()) {
            this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, ubo.bindingPoint, ubo.buffer);
        }
    }
}
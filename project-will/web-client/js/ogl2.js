import { Mat4 } from './math.js';

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
        this.promise = this._load(url);
    }

    _load(url) {
        return new Promise((resolve, reject) => {
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
                resolve();
            };
            image.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
            image.src = url;
        });
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

export class Entity {
    constructor(geometry = null, material = null) {
        this.geometry = geometry;
        this.material = material;
        this.transform = new Mat4();
        this.worldMatrix = new Mat4();
        this.parent = null;
        this.children = [];
        // Lighting properties
        this.lightType = null; 
        this.color = [1, 1, 1];
        this.direction = [-0.5, -1.0, -0.5]; // Default direction for directional light
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

    isReady() {
        return true;
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights) {
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        if (this.geometry && this.material && this.material.isReady()) {
            this.material.apply();
            this.material.setUniform('u_modelMatrix', this.worldMatrix);
            this.material.setUniform('u_viewMatrix', viewMatrix);
            this.material.setUniform('u_projectionMatrix', projectionMatrix);
            
            if (!this.lightType && lights.length > 0) {
                const count = Math.min(lights.length, 4);
                this.material.setUniform('u_lightsCount', count);
                for (let i = 0; i < count; i++) {
                    const light = lights[i];
                    const prefix = `u_lights[${i}]`;
                    this.material.setUniform(`${prefix}.type`, light.type === LightType.AMBIENT ? 0 : (light.type === LightType.DIRECTIONAL ? 1 : 2));
                    this.material.setUniform(`${prefix}.color`, light.color);
                    if (light.type !== LightType.AMBIENT) {
                        const pos = [
                            light.worldMatrix.data[12],
                            light.worldMatrix.data[13],
                            light.worldMatrix.data[14]
                        ];
                        this.material.setUniform(`${prefix}.position`, pos);
                        if (light.type === LightType.DIRECTIONAL) {
                            // For directional lights, we use the direction vector provided in Entity.direction
                            const dir = light.direction;
                            this.material.setUniform(`${prefix}.direction`, dir);
                        }
                    }
                }
            }

            this.geometry.bind();
            this.geometry.draw();
        }

        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
        }
    }
}

export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.root = new Entity();
        this.identity = new Mat4();
    }

    add(entity) {
        this.root.add(entity);
    }

    render(viewMatrix, projectionMatrix) {
        const gl = this.gl;
        const lights = [];
        
        // 1. First pass: Update all world matrices and collect lights
        this._updateAndCollect(this.root, this.identity, lights);

        // 2. Second pass: Render the scene with collected light info
        this.root.render(gl, this.identity, viewMatrix, projectionMatrix, lights);
    }

    _updateAndCollect(entity, parentWorldMatrix, lights) {
        Mat4.multiply(parentWorldMatrix, entity.transform, entity.worldMatrix);

        if (entity.lightType) {
            const lightObj = {
                type: entity.lightType,
                color: entity.color,
                direction: entity.direction || [0, -1, 0], // Fallback direction
                worldMatrix: new Mat4() 
            };
            // Copy world matrix to the light's local copy for use in the second pass
            for(let i=0; i<16; i++) lightObj.worldMatrix.data[i] = entity.worldMatrix.data[i];
            lights.push(lightObj);
        }

        for (const child of entity.children) {
            this._updateAndCollect(child, entity.worldMatrix, lights);
        }
    }
}

export class AmbientLight extends Entity {
    constructor(color = [1, 1, 1]) {
        super();
        this.lightType = LightType.AMBIENT;
        this.color = color;
    }
}

export class DirectionalLight extends Entity {
    constructor(color = [1, 1, 1], direction = [-0.5, -1.0, -0.5]) {
        super();
        this.lightType = LightType.DIRECTIONAL;
        this.color = color;
        this.direction = direction;
    }
}

export class PointLight extends Entity {
    constructor(color = [1, 1, 1]) {
        super();
        this.lightType = LightType.POINT;
        this.color = color;
    }
}

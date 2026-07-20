class Shader {
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

class Buffer {
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

class Texture {
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

export function InitApp() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;

        varying vec2 vTextureCoord;

        void main() {
            gl_Position = aVertexPosition;
            vTextureCoord = aTextureCoord;
        }
    `;

    const fsSource = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;

        void main() {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
        }
    `;

    const shader = new Shader(gl, vsSource, fsSource);
    if (!shader) return;

    // Triangle vertices
    const vertices = new Float32Array([
        0.0, 0.5,
        -0.5, -0.5,
        0.5, -0.5,
    ]);
    const vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, vertices);

    // Texture coordinates matching the triangle vertices
    // (0, 0.5) -> UV (0.5, 1.0)
    // (-0.5, -0.5) -> UV (0.0, 0.0)
    // (0.5, -0.5) -> UV (1.0, 0.0)
    const texCoords = new Float32Array([
        0.5, 1.0,
        0.0, 0.0,
        1.0, 0.0,
    ]);
    const textureBuffer = new Buffer(gl, gl.ARRAY_BUFFER, texCoords);

    const woodTexture = new Texture(gl, 'img/wood-box.png');

    function render() {
        gl.clearColor(0.127, 0.127, 0.827, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(shader.program);

        // Set up Vertex Positions
        const positionLoc = gl.getAttribLocation(shader.program, 'aVertexPosition');
        gl.enableVertexAttribArray(positionLoc);
        vertexBuffer.bind();
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Set up Texture Coordinates
        const texCoordLoc = gl.getAttribLocation(shader.program, 'aTextureCoord');
        gl.enableVertexAttribArray(texCoordLoc);
        textureBuffer.bind();
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        // Bind the texture
        woodTexture.bind(0);
        const samplerLoc = gl.getUniformLocation(shader.program, 'uSampler');
        gl.uniform1i(samplerLoc, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function animate() {
        render();
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

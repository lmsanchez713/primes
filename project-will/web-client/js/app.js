import { Shader, Buffer, Texture } from './ogl2.js';

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
import { Shader, Buffer, Texture, Geometry, Material, Entity } from './ogl2.js';

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

    // Texture coordinates matching the triangle vertices
    // (0, 0.5) -> UV (0.5, 1.0)
    // (-0.5, -0.5) -> UV (0.0, 0.0)
    // (0.5, -0.5) -> UV (1.0, 0.0)
    const texCoords = new Float32Array([
        0.5, 1.0,
        0.0, 0.0,
        1.0, 0.0,
    ]);

    const woodTexture = new Texture(gl, 'img/wood-box.png');

    const posBuffer = new Buffer(gl, gl.ARRAY_BUFFER, vertices);
    const texBuffer = new Buffer(gl, gl.ARRAY_BUFFER, texCoords);

    // Create the Geometry object
    const geometry = new Geometry(gl, gl.TRIANGLES);

    // Setup the attributes ONCE during initialization
    // Note: You'll need to get locations from the shader
    const posLoc = gl.getAttribLocation(shader.program, 'aVertexPosition');
    const texLoc = gl.getAttribLocation(shader.program, 'aTextureCoord');

    geometry.addAttribute(posBuffer, posLoc, 2); // size 2 because x, y
    geometry.addAttribute(texBuffer, texLoc, 2); // size 2 because u, v
    geometry.setCount(3); // We are drawing a triangle

    // Wrap it in an Entity (The High-Level object)
    const material = new Material(gl, shader);
    material.setTexture('uSampler', woodTexture);

    const triangleEntity = new Entity(geometry, material);

    // --- 2. RENDER PHASE (Inside render function) ---

    gl.clearColor(0.127, 0.127, 0.827, 1.0);
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        // In the render loop, you NO LONGER call gl.enableVertexAttribArray 
        // or gl.vertexAttribPointer. You only do this:
        triangleEntity.draw(gl);
    }

    function animate() {
        render();
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}
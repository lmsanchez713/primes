import { Shader, Buffer, Texture, Geometry, Material, Entity } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4 } from './math.js';

export function InitApp() {
    const canvas = document.getElementById('glCanvas');
    const engine = new Engine(canvas);

    if (!engine.gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    const gl = engine.gl;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // --- 1. SHADERS ---
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat4 u_modelMatrix;
        varying vec2 vTextureCoord;

        void main() {
            gl_Position = aVertexPosition * u_modelMatrix;
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

    // --- 2. GEOMETRY & MATERIAL ---
    const vertices = new Float32Array([
        0.0, 0.5,
        -0.5, -0.5,
        0.5, -0.5,
    ]);

    const texCoords = new Float32Array([
        0.5, 1.0,
        0.0, 0.0,
        1.0, 0.0,
    ]);

    const posBuffer = new Buffer(gl, gl.ARRAY_BUFFER, vertices);
    const texBuffer = new Buffer(gl, gl.ARRAY_BUFFER, texCoords);

    const geometry = new Geometry(gl, gl.TRIANGLES);
    const posLoc = gl.getAttribLocation(shader.program, 'aVertexPosition');
    const texLoc = gl.getAttribLocation(shader.program, 'aTextureCoord');

    geometry.addAttribute(posBuffer, posLoc, 2);
    geometry.addAttribute(texBuffer, texLoc, 2);
    geometry.setCount(3);

    const woodTexture = new Texture(gl, 'img/wood-box.png');
    const material = new Material(gl, shader);
    material.setTexture('uSampler', woodTexture);

    // --- 3. ENTITY HIERARCHY ---
    const triangleEntity = new Entity(geometry, material);
    engine.scene.add(triangleEntity);

    // Move it slightly to see it's working (using local transform)
    triangleEntity.transform = Mat4.translation(0.0, 0.0, 0.0); 

    // Add a child to demonstrate hierarchy
    const childEntity = new Entity(geometry, material);
    childEntity.transform = Mat4.translation(0.1, 0.1, 0.0);
    triangleEntity.add(childEntity);

    // --- 4. START ENGINE ---
    gl.clearColor(0.127, 0.127, 0.827, 1.0);
    engine.start();
}

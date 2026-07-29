import { Shader, Buffer, Texture, Geometry, Material, Entity } from './ogl2.js';
import { Engine } from './engine.js';

let engine;

/**
 * Initializes the application, setting up the engine, 
 * a scene with a textured quad, and an orthogonal camera.
 */
export async function InitApp() {
    const canvas = document.getElementById('glCanvas');
    engine = new Engine(canvas);
    if (!engine.gl) return;
    const gl = engine.gl;

    // 1. Load Shader
    const vsSource = await (await fetch('glsl/vertex.glsl')).text();
    const fsSource = await (await fetch('glsl/fragment.glsl')).text();
    const shader = new Shader(gl, vsSource, fsSource);

    // 2. Load Texture (using lumi.png as the pre-loaded asset)
    const texture = new Texture(gl, 'img/lumi.png');

    // 3. Create Quad Geometry (Two Triangles)
    const quadGeo = createQuadGeometry(gl, shader);

    // 4. Create Material with the loaded texture
    const material = new Material(gl, shader);
    material.setTexture('uSampler', texture);

    // 5. Create and add an Entity (the Quad) to the Scene
    const quadEntity = new Entity(quadGeo, material);
    engine.scene.add(quadEntity);

    // 6. Set up Orthogonal Camera
    engine.setProjectionMode('ortho');
    // Define orthographic bounds: left, right, bottom, top, near, far
    engine.camera.updateOrthographic(-2, 2, -2, 2, 0.1, 100);
    engine.camera.updateView();

    // 7. Start the engine loop
    engine.start();
}

/**
 * Helper to create a simple quad geometry
 */
function createQuadGeometry(gl, shader) {
    // Vertices for two triangles forming a quad
    const vertices = new Float32Array([
        -0.5, 0.5, 0.0, // v0
        0.5, 0.5, 0.0, // v1
        -0.5, -0.5, 0.0, // v2
        0.5, -0.5, 0.0, // v3
        -0.5, -0.5, 0.0, // v4
        0.5, 0.5, 0.0  // v5
    ]);

    // Texture coordinates
    const texCoords = new Float32Array([
        0.0, 1.0, // v0
        1.0, 1.0, // v1
        0.0, 0.0, // v2
        1.0, 0.0, // v3
        0.0, 0.0, // v4
        1.0, 1.0  // v5
    ]);

    // Normals (pointing towards the camera)
    const normals = new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, 1, 0, 0, 1, 0, 0, 1
    ]);

    // Tangents (for normal mapping support)
    const tangents = new Float32Array([
        1, 0, 0, 1, 0, 0, 1, 0, 0,
        1, 0, 0, 1, 0, 0, 1, 0, 0
    ]);

    const geo = new Geometry(gl, gl.TRIANGLES);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, vertices), gl.getAttribLocation(shader.program, 'aPosition'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, texCoords), gl.getAttribLocation(shader.program, 'aTexCoord'), 2);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, normals), gl.getAttribLocation(shader.program, 'aNormal'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, tangents), gl.getAttribLocation(shader.program, 'aTangent'), 4);
    geo.setCount(6);

    return geo;
}

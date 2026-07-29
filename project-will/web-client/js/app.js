import { Shader, Buffer, Texture, Geometry, Material, Entity, DirectionalLight, PointLight } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4 } from './math.js';
import { CameraController } from './camera_controller.js';

let engine;

/**
 * Helper to create a simple quad geometry
 */
function createQuadGeometry(gl, shader) {
    // Vertices for two triangles forming a quad
    const vertices = new Float32Array([
        -1.0, -1.0, 0.0, // v0
        1.0, 1.0, 0.0, // v1
        1.0, -1.0, 0.0, // v2
        -1.0, -1.0, 0.0, // v3
        -1.0, 1.0, 0.0, // v4
        1.0, 1.0, 0.0  // v5
    ]);

    // Texture coordinates
    const texCoords = new Float32Array([
        0.0, 1.0, // v0
        1.0, 0.0, // v1
        1.0, 1.0, // v2
        0.0, 1.0, // v3
        0.0, 0.0, // v4
        1.0, 0.0  // v5
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

    // 2. Load Texture
    const texture = new Texture(gl, 'img/lumi.png');

    // 3. Create Quad Geometry
    const quadGeo = createQuadGeometry(gl, shader);

    // 4. Create Material
    const material = new Material(gl, shader);
    material.setTexture('uSampler', texture);

    // 5. Create and add the Quad Entity
    const quadEntity = new Entity(quadGeo, material);
    engine.scene.add(quadEntity);

    //const ambientLight = new Entity();
    //ambientLight.lightType = 'Ambient';
    //ambientLight.color = [1.0, 1.0, 1.0]; // White light
    //engine.scene.add(ambientLight);

    const sunLight = new DirectionalLight(gl); // Assuming DirectionalLight is a subclass of Entity
    sunLight.color = [1.0, 1.0, 1.0];
    sunLight.direction = [-0.5, -0.5, -1.0];
    engine.scene.add(sunLight);

    // 7. Set up Camera
    engine.setProjectionMode('ortho');
    engine.camera.updateOrthographic(-1, 1, 1, -1, 0.1, 100);
    engine.camera.updateView();

    // engine.setController(new CameraController(engine.camera));

    // 8. Start the engine loop
    engine.start();
}

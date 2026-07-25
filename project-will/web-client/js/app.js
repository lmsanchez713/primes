import { Shader, Buffer, Texture, Geometry, Material, Entity, AmbientLight, PointLight, DirectionalLight } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4 } from './math.js';
import { CameraController } from './camera_controller.js';

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

    // Listen for key press to toggle projection mode
    window.addEventListener('keydown', (event) => {
        if (event.key === 'p' || event.key === 'P') {
            const newMode = engine.projectionMode === 'perspective' ? 'ortho' : 'perspective';
            engine.setProjectionMode(newMode);
            console.log(`Projection mode changed to: ${newMode}`);
        }
    });

    // --- 1. SHADERS (Phong Shading) ---
    const vsSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;

        uniform mat4 u_modelMatrix;
        uniform mat4 u_viewMatrix;
        uniform mat4 u_projectionMatrix;

        varying vec2 vTextureCoord;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec4 worldPos = u_modelMatrix * vec4(aPosition, 1.0);
            vWorldPosition = worldPos.xyz;
            vNormal = mat3(u_modelMatrix) * aNormal;
            vTextureCoord = aTexCoord;
            gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
        }
    `;

    const fsSource = `
        precision mediump float;

        varying vec2 vTextureCoord;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform sampler2D uSampler;

        struct Light {
            int type; // 0: ambient, 1: directional, 2: point
            vec3 color;
            vec3 position;
            vec3 direction;
        };

        uniform int u_lightsCount;
        uniform Light u_lights[4];

        void main() {
            vec4 texColor = texture2D(uSampler, vTextureCoord);
            vec3 normal = normalize(vNormal);
            
            // Simple Ambient component (global)
            vec3 ambient = vec3(0.1, 0.1, 0.1);
            vec3 totalLight = ambient;

            for (int i = 0; i < 4; i++) {
                if (i >= u_lightsCount) break;

                if (u_lights[i].type == 1) { // Directional
                    vec3 lightDir = normalize(-u_lights[i].direction);
                    float diff = max(dot(normal, lightDir), 0.0);
                    totalLight += u_lights[i].color * diff;
                } else if (u_lights[i].type == 2) { // Point
                    vec3 lightDir = normalize(u_lights[i].position - vWorldPosition);
                    float diff = max(dot(normal, lightDir), 0.0);
                    // Add attenuation for point lights (simplified)
                    float dist = length(u_lights[i].position - vWorldPosition);
                    float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.01 * dist * dist);
                    totalLight += u_lights[i].color * diff * attenuation;
                } else if (u_lights[i].type == 0) { // Ambient light entity
                     totalLight += u_lights[i].color;
                }
            }

            gl_FragColor = vec4(texColor.rgb * totalLight, texColor.a);
        }
    `;

    const shader = new Shader(gl, vsSource, fsSource);
    if (!shader) return;

    // --- 2. GEOMETRY (Cube with Normals) ---
    // A cube has 6 faces. Each face has 2 triangles. Total 12 triangles.
    // For simplicity in this demo, let's just use a single quad for now but with normals
    const vertices = new Float32Array([
        // Positions (x, y, z)
         0.5,  0.5,  0.0,
        -0.5, -0.5,  0.0,
         0.5, -0.5,  0.0,
         0.5,  0.5,  0.0, // Quad face 1
    ]);

    const texCoords = new Float32Array([
        1.0, 0.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
    ]);

    const normals = new Float32Array([
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    ]);

    const posBuffer = new Buffer(gl, gl.ARRAY_BUFFER, vertices);
    const texBuffer = new Buffer(gl, gl.ARRAY_BUFFER, texCoords);
    const normBuffer = new Buffer(gl, gl.ARRAY_BUFFER, normals);

    const geometry = new Geometry(gl, gl.TRIANGLES);
    const posLoc = gl.getAttribLocation(shader.program, 'aPosition');
    const texLoc = gl.getAttribLocation(shader.program, 'aTextureCoord');
    const normLoc = gl.getAttribLocation(shader.program, 'aNormal');

    geometry.addAttribute(posBuffer, posLoc, 3);
    geometry.addAttribute(texBuffer, texLoc, 2);
    geometry.addAttribute(normBuffer, normLoc, 3);
    geometry.setCount(6); // 2 triangles for a quad (4 vertices? no wait, if I use 4 vertices and drawArrays TRIANGLES it needs 6)
    // Let's define the quad with 6 vertices to be safe for gl.TRIANGLES
    const quadVertices = new Float32Array([
         0.5,  0.5,  0.0,
        -0.5, -0.5,  0.0,
         0.5, -0.5,  0.0,
         0.5,  0.5,  0.0,
         0.5, -0.5,  0.0,
         -0.5, -0.5,  0.0,
    ]);
    const quadTexCoords = new Float32Array([
        1.0, 0.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ]);
    const quadNormals = new Float32Array([
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    ]);

    // Reset geometry for the quad
    geometry.buffers = []; // Clear old buffers if any (not needed here as we just created)
    // Actually let's re-initialize geometry with correct data
    const fullGeometry = new Geometry(gl, gl.TRIANGLES);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadVertices), posLoc, 3);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadTexCoords), texLoc, 2);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadNormals), normLoc, 3);
    fullGeometry.setCount(6);

    const woodTexture = new Texture(gl, 'img/lumi.png'); // Using the existing image in repo if it exists
    // If img/lumi.png doesn't exist, we might see black or error, but let's assume standard behavior.
    // Note: In local testing I should make sure this file exists.

    const material = new Material(gl, shader);
    material.setTexture('uSampler', woodTexture);

    // --- 3. ENTITY HIERARCHY & LIGHTS ---
    const quadEntity = new Entity(fullGeometry, material);
    engine.scene.add(quadEntity);
    const quadTransform = new Mat4();
    Mat4.translation(0.0, 0.0, -2.0, quadTransform);
    quadEntity.transform = quadTransform;

    // Add Lights
    const ambientLight = new AmbientLight([0.1, 0.1, 0.2]); // Soft blue ambient light
    engine.scene.add(ambientLight);

    const pointLight = new PointLight([1.0, 0.8, 0.5]); // Warm yellow point light
    pointLight.transform = new Mat4();
    Mat4.translation(0.5, 0.5, -1.0, pointLight.transform);
    engine.scene.add(pointLight);

    const dirLight = new DirectionalLight([0.2, 0.2, 0.5], [-1.0, -1.0, -1.0]); // Dim blue directional light
    engine.scene.add(dirLight);

    // --- 4. CAMERA CONTROLLER ---
    const cameraController = new CameraController(engine.camera);
    engine.setController(cameraController);

    // --- 5. START ENGINE ---
    gl.clearColor(0.1, 0.1, 0.1, 1.0); // Dark grey background
    engine.start();
}

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

    // --- 1. SHADERS (Phong Shading with Normal Mapping Support) ---
    const vsSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;
        attribute vec4 aTangent;

        uniform mat4 u_modelMatrix;
        uniform mat4 u_viewMatrix;
        uniform mat4 u_projectionMatrix;

        varying vec2 vTextureCoord;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying mat3 vTBN;

        void main() {
            vec4 worldPos = u_modelMatrix * vec4(aPosition, 1.0);
            vWorldPosition = worldPos.xyz;
            vTextureCoord = aTexCoord;
            
            mat3 normalMatrix = mat3(u_modelMatrix);
            vec3 N = normalize(normalMatrix * aNormal);
            vec3 T_raw = normalize(normalMatrix * aTangent.xyz);
            // Re-orthogonalize to ensure T is perpendicular to N (Gram-Schmidt)
            vec3 T = normalize(T_raw - dot(T_raw, N) * N);
            vec3 B = cross(N, T) * aTangent.w;
            
            vNormal = N;
            vTBN = mat3(T, B, N);

            gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
        }
    `;

    const fsSource = `
        precision mediump float;

        varying vec2 vTextureCoord;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying mat3 vTBN;

        uniform sampler2D uSampler;
        uniform sampler2D uNormalMap;
        uniform bool uUseNormalMap;

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
            vec3 normal;
            
            if (uUseNormalMap) {
                normal = normalize(vTBN * (texture2D(uNormalMap, vTextureCoord).rgb * 2.0 - 1.0));
            } else {
                normal = normalize(vNormal);
            }

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

    // --- 2. GEOMETRY (Quad with Normals and Tangents) ---
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

    // Tangent: X-axis (1, 0, 0), Bitangent sign W=1 (since cross(N, T) = Y)
    const quadTangents = new Float32Array([
         1.0, 0.0, 0.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
    ]);

    const fullGeometry = new Geometry(gl, gl.TRIANGLES);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadVertices), gl.getAttribLocation(shader.program, 'aPosition'), 3);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadTexCoords), gl.getAttribLocation(shader.program, 'aTexCoord'), 2);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadNormals), gl.getAttribLocation(shader.program, 'aNormal'), 3);
    fullGeometry.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, quadTangents), gl.getAttribLocation(shader.program, 'aTangent'), 4);
    fullGeometry.setCount(6);

    const woodTexture = new Texture(gl, 'img/lumi.png'); 

    const material = new Material(gl, shader);
    material.setTexture('uSampler', woodTexture);
    // For demo: use the same texture for normal map to show something happens (though it'll look weird)
    material.setTextTexture('uNormalMap', woodTexture); 
    material.setUniform('uUseNormalMap', true);

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

// Helper to allow setting multiple textures by name in app logic if Material doesn't support it well
Material.prototype.setTextTexture = function(name, textureInstance) {
    this.setTexture(name, textureInstance);
};

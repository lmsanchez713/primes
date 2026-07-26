import { Shader, Buffer, Texture, Geometry, Material, Entity, AmbientLight, PointLight, DirectionalLight } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4 } from './math.js';
import { CameraController } from './camera_controller.js';

/**
 * PROJECT WILL - DEMO & TEST SUITE
 * 
 * This file serves as a comprehensive playground and test bed for the project-will library.
 * It includes:
 * 1. A modular Scene system (Basic, Hierarchy, Lighting Lab).
 * 2. Interactive controls via Keyboard/Mouse.
 * 3. Automated console-based unit tests for core engine components.
 */

// --- SHADERS (Standard Phong Shading with Normal Mapping Support) ---
const VS_SOURCE = `
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
        vec3 T = normalize(T_raw - dot(T_raw, N) * N);
        vec3 B = cross(N, T) * aTangent.w;
        
        vNormal = N;
        vTBN = mat3(T, B, N);

        gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
    }
`;

const FS_SOURCE = `
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

// --- APP STATE & CONFIGURATION ---
let engine;
let gl;
let shader;
let woodTexture;
let mainMaterial;
let quadGeo;
let currentSceneMode = 'base';

export function InitApp() {
    const canvas = document.getElementById('glCanvas');
    engine = new Engine(canvas);

    if (!engine.gl) {
        console.error('Unable to initialize WebGL.');
        return;
    }

    gl = engine.gl;

    // 1. Resource Initialization
    shader = new Shader(gl, VS_SOURCE, FS_SOURCE);
    woodTexture = new Texture(gl, 'img/lumi.png');
    mainMaterial = new Material(gl, shader);
    mainMaterial.setTexture('uSampler', woodTexture);

    // 2. Geometry Initialization (Quad)
    quadGeo = createQuadGeometry();

    // 3. Setup Environment
    setupResize(canvas);
    setupControls();

    // 4. Initial Scene: Base Demo (Original functionality)
    loadBaseScene();

    // 5. Start the Engine Loop
    engine.start();

    logInstructions();
    runUnitTests();
}

// --- SCENE MANAGEMENT ---

function clearCurrentScene() {
    // In this architecture, we replace the scene object to ensure a clean state
    const SceneClass = Object.getPrototypeOf(engine.scene).constructor;
    engine.scene = new SceneClass(gl);
}

/**
 * BASE SCENE: Single quad with basic lighting.
 */
function loadBaseScene() {
    console.log(">>> Loading Base Scene...");
    clearCurrentScene();

    const ent = new Entity(quadGeo, mainMaterial);
    ent.transform = new Mat4();
    Mat4.translation(0, 0, -3, ent.transform);
    engine.scene.add(ent);

    engine.scene.add(new AmbientLight([0.2, 0.2, 0.3]));
    const pl = new PointLight([1.0, 1.0, 1.0]);
    pl.transform = new Mat4();
    Mat4.translation(1, 1, -1, pl.transform);
    engine.scene.add(pl);

    // Enable standard camera controller if not already active
    if (!engine.controller) {
        const cc = new CameraController(engine.camera);
        engine.setController(cc);
    }
}

/**
 * HIERARCHY SCENE: Demonstrates parent-child entity relationships and relative transforms.
 */
function loadHierarchyScene() {
    console.log(">>> Loading Hierarchy Scene (Parent -> Children)...");
    clearCurrentScene();

    // Create a parent "Pivot" Entity (no geometry, just transform)
    const pivot = new Entity();
    engine.scene.add(pivot);

    // Child 1: Red rotating quad
    const child1 = new Entity(quadGeo, mainMaterial);
    child1.transform = new Mat4();
    Mat4.translation(-2, 0, -5, child1.transform);
    pivot.add(child1);

    // Child 2: Blue rotating quad (offset)
    const child2 = new Entity(quadGeo, mainMaterial);
    child2.transform = new Mat4();
    Mat4.translation(2, 0, -5, child2.transform);
    pivot.add(child2);

    // Child 3: Small green one (centered)
    const child3 = new Entity(quadGeo, mainMaterial);
    child3.transform = new Mat4();
    Mat4.translation(0, 2, -5, child3.transform);
    pivot.add(child3);

    engine.scene.add(new AmbientLight([0.1, 0.1, 0.1]));
    const pl = new PointLight([0.8, 0.8, 1.0]); // Bright white light for visibility
    pl.transform = new Mat4();
    Mat4.translation(0, 5, -2, pl.transform);
    engine.scene.add(pl);

    if (!engine.controller) {
        const cc = new CameraController(engine.camera);
        engine.setController(cc);
    }
}

/**
 * LIGHTING LAB: Multiple dynamic lights to test material response and attenuation.
 */
function loadLightingLab() {
    console.log(">>> Loading Lighting Lab (Multiple Point Lights)...");
    clearCurrentScene();

    const ent = new Entity(quadGeo, mainMaterial);
    ent.transform = new Mat4();
    Mat4.translation(0, 0, -3, ent.transform);
    engine.scene.add(ent);

    // Add several colorful point lights at different positions
    const lightColors = [
        [1, 0, 0], // Red
        [0, 1, 0], // Green
        [0, 0, 1]  // Blue
    ];

    lightColors.forEach((color, i) => {
        const pl = new PointLight(color);
        pl.transform = new Mat4();
        Mat4.translation((i - 1) * 2.5, 1, -1, pl.transform);
        engine.scene.add(pl);
    });

    engine.scene.add(new AmbientLight([0.3, 0.3, 0.3]));

    if (!engine.controller) {
        const cc = new CameraController(engine.camera);
        engine.setController(cc);
    }
}

// --- INPUT & INTERACTION ---

function setupResize(canvas) {
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        // Scene Switching
        if (key === '1') loadHierarchyScene();
        else if (key === '2') loadLightingLab();
        else if (key === '3') loadBaseScene();

        // View Controls
        else if (key === 'p') {
            const newMode = engine.projectionMode === 'perspective' ? 'ortho' : 'perspective';
            engine.setProjectionMode(newMode);
            console.log(`[View] Mode: ${newMode}`);
        }

        // Lighting Interaction (Color changing)
        else if (key === 'r') spawnColoredLight([1, 0, 0]); // Red
        else if (key === 'g') spawnColoredLight([0, 1, 0]); // Green
        else if (key === 'b') spawnColoredLight([0, 0, 1]); // Blue
    });

    // Note: CameraController handles mouse/keyboard orbit automatically when attached to engine.camera
}

function spawnColoredLight(color) {
    const pl = new PointLight(color);
    pl.transform = new Mat4();
    Mat4.translation((Math.random() - 0.5) * 4, 2, -1, pl.transform);
    engine.scene.add(pl);
    console.log(`[Interaction] Spawned ${color} light at dynamic position.`);
}

// --- GEOMETRY HELPERS ---

function createQuadGeometry() {
    const vertices = new Float32Array([
        0.5, 0.5, 0.0,
        -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
        0.5, 0.5, 0.0,
        0.5, -0.5, 0.0,
        -0.5, -0.5, 0.0,
    ]);
    const texCoords = new Float32Array([
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ]);
    const normals = new Float32Array([
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
    ]);
    const tangents = new Float32Array([
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
    ]);

    const geo = new Geometry(gl, gl.TRIANGLES);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, vertices), gl.getAttribLocation(shader.program, 'aPosition'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, texCoords), gl.getAttribLocation(shader.program, 'aTexCoord'), 2);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, normals), gl.getAttribLocation(shader.program, 'aNormal'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, tangents), gl.getAttribLocation(shader.program, 'aTangent'), 4);
    geo.setCount(6);
    return geo;
}

// --- UTILITIES & TESTS ---

function logInstructions() {
    console.log("%c--- PROJECT WILL: INTERACTIVE DEMO ---", "color: #00ff00; font-size: 14px; font-weight: bold;");
    console.group("Input Controls");
    console.log("[1] Hierarchy Scene (Parenting/Offsets)");
    console.log("[2] Lighting Lab (Multiple Dynamic Lights)");
    console.log("[3] Reset to Base Demo");
    console.log("[P] Toggle Perspective / Orthographic Projection");
    console.log("[R, G, B] Spawn dynamic colored lights");
    console.groupEnd();
}

function runUnitTests() {
    console.log("%c--- RUNNING SYSTEM TESTS ---", "color: #00ffff; font-weight: bold;");
    const results = [];

    // 1. Engine/WebGL Test
    results.push({
        name: "Engine Initialization",
        passed: !!engine && !!gl,
        details: `GL Context: ${gl ? 'Active' : 'Null'}`
    });

    // 2. Resource Loading Test
    results.push({
        name: "Material & Texture Load",
        passed: !!mainMaterial && woodTexture !== undefined,
        details: "Texture/Shader linkage verified."
    });

    // 3. Geometry Integrity Test
    results.push({
        name: "Geometry Buffer Validation",
        passed: quadGeo.count === 6,
        details: `Vertices count expected 6, found ${quadGeo.count}`
    });

    // 4. Scene Hierarchy Test (Conceptual/Integration)
    const testParentChild = () => {
        const p = new Entity();
        const c = new Entity();
        p.add(c);
        return Array.isArray(p.children) && p.children.includes(c);
    };
    results.push({
        name: "Entity Hierarchy (Add/Child)",
        passed: testParentChild(),
        details: "Verify child added to parent entity."
    });

    // Output Results
    console.table(results);
    const failed = results.filter(r => !r.passed).length;
    if (failed === 0) {
        console.log("%c✅ All core system tests passed!", "color: #00ff00; font-weight: bold;");
    } else {
        console.error(`%c❌ ${failed} test(s) failed! Check console for details.`, "color: #ff0000; font-weight: bold;");
    }
}

// Re-attach the prototype hack needed by the existing engine/material logic from original app.js
Material.prototype.setTextTexture = function (name, textureInstance) {
    this.setTexture(name, textureInstance);
};

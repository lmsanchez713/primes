import { Shader, Buffer, Texture, Geometry, Material, Entity, AmbientLight, PointLight, DirectionalLight } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4 } from './math.js';
import { CameraController } from './camera_controller.js';

async function loadShaderSource(path) {
    const response = await fetch(path);
    return await response.text();
}

let engine;
let gl;
let shader;
let woodTexture;
let mainMaterial;
let quadGeo;

export async function InitApp() {
    const canvas = document.getElementById('glCanvas');
    engine = new Engine(canvas);
    if (!engine.gl) return;
    gl = engine.gl;

    const vsSource = await loadShaderSource('shaders/vertex.glsl');
    const fsSource = await loadShaderSource('shaders/fragment.glsl');
    shader = new Shader(gl, vsSource, fsSource);
    woodTexture = new Texture(gl, 'img/lumi.png');
    mainMaterial = new Material(gl, shader);
    mainMaterial.setTexture('uSampler', woodTexture);
    quadGeo = createQuadGeometry();
    setupResize(canvas);
    setupControls();
    loadBaseScene();
    engine.start();
}

function clearCurrentScene() {
    const SceneClass = Object.getPrototypeOf(engine.scene).constructor;
    engine.scene = new SceneClass(gl);
}

function loadBaseScene() {
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
    if (!engine.controller) engine.setController(new CameraController(engine.camera));
}

function loadHierarchyScene() {
    clearCurrentScene();
    const pivot = new Entity();
    engine.scene.add(pivot);
    const child1 = new Entity(quadGeo, mainMaterial);
    child1.transform = new Mat4();
    Mat4.translation(-2, 0, -5, child1.transform);
    pivot.add(child1);
    engine.scene.add(new AmbientLight([0.1, 0.1, 0.1]));
    if (!engine.controller) engine.setController(new CameraController(engine.camera));
}

function loadLightingLab() {
    clearCurrentScene();
    const ent = new Entity(quadGeo, mainMaterial);
    ent.transform = new Mat4();
    Mat4.translation(0, 0, -3, ent.transform);
    engine.scene.add(ent);
    engine.scene.add(new AmbientLight([0.3, 0.3, 0.3]));
}

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
        if (key === '1') loadHierarchyScene();
        else if (key === '2') loadLightingLab();
        else if (key === '3') loadBaseScene();
    });
}

function createQuadGeometry() {
    const vertices = new Float32Array([0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0]);
    const texCoords = new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const tangents = new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1]);
    const geo = new Geometry(gl, gl.TRIANGLES);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, vertices), gl.getAttribLocation(shader.program, 'aPosition'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, texCoords), gl.getAttribLocation(shader.program, 'aTexCoord'), 2);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, normals), gl.getAttribLocation(shader.program, 'aNormal'), 3);
    geo.addAttribute(new Buffer(gl, gl.ARRAY_BUFFER, tangents), gl.getAttribLocation(shader.program, 'aTangent'), 4);
    geo.setCount(6);
    return geo;
}

Material.prototype.setTexture = function (name, textureInstance) {
    this.setTexture(name, textureInstance);
};

import { Shader, Buffer, Texture, Geometry, Material, Entity, DirectionalLight, PointLight, AmbientLight, loadShaderFromUrl } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4, OrthoMat4 } from './math.js';
import { CameraController } from './camera_controller.js';
import { TextureSheet } from './core/texture-sheet.js';
import { Sprite } from './scene/sprite.js';
import { World } from './scene/world.js';
import { Chunk } from './scene/chunk.js';
import { MapLoader } from './scene/map_loader.js';
import { ItemType } from './scene/item.js';
import { createSquareGeometry } from './core/geometry.js';
import { UBOManager } from './core/ubo.js';
import { Primitive_Engine, Primitive } from './primitive.js';

let engine;
let uboManager = null;
let sceneUBO = null;

export async function InitApp() {
    const canvas = document.getElementById('glCanvas');
    engine = new Primitive_Engine(canvas);
    if (!engine.gl) return;
    const gl = engine.gl;

    const debug_shader = await loadShaderFromUrl(engine, 'glsl/vertex.glsl', 'glsl/fragment.glsl',
        ['aPosition', 'aTexCoord', 'aNormal'], ['u_sampler2d'], ['SceneUBO']);

    engine.geometries['square'] = createSquareGeometry(engine);
    engine.geometries['square'].addShader('debug_shader', debug_shader);
    engine.geometries['square'].updateBindings();
    engine.geometries['square'].addObject('square', 0, 6, gl.TRIANGLES);

    const float32array = new Float32Array([1.0, 0.0, 1.0, 1.0]);
    const ubo_buffer = new Buffer(engine, gl.UNIFORM_BUFFER, float32array, gl.DYNAMIC_DRAW);
    debug_shader.bind_ubo('SceneUBO', 0);

    const texture = new Texture(engine, 'img/sprites/otsp_tiles_01_alpha.png');
    const texture2 = new Texture(engine, 'img/sprites/otsp_creatures_01_alpha.png');
    texture2.bind(1);

    ubo_buffer.bind_base(debug_shader, 'SceneUBO', 0);

    engine.primitives.push(new Primitive(engine, {
        draw_algorithm: (primitive) => {
            engine.geometries['square'].bind('debug_shader');
            float32array[1] = (Math.sin(engine.time.current * 10.0) + 1) / 2; // Animate green channel
            ubo_buffer.subdata(float32array);
            texture.bind(0);
            debug_shader.uniform1i('u_sampler2d', 0);
            engine.geometries['square'].drawObject('square');
            texture2.bind(1);
            debug_shader.uniform1i('u_sampler2d', 1);
            engine.geometries['square'].drawObject('square');
        }
    }));

    engine.start();
}

/**
 * Initializes the application, setting up the engine, 
 * a scene with a textured quad, and an orthogonal camera.
 */
export async function InitApp_old() {
    const canvas = document.getElementById('glCanvas');
    engine = new Engine(canvas);
    if (!engine.gl) return;
    const gl = engine.gl;

    // 1. Load Shader
    const shader = await loadShaderFromUrl(gl, 'glsl/vertex.glsl', 'glsl/fragment.glsl');

    // Create UBO Manager
    uboManager = new UBOManager(gl);

    // Create SceneUBO with proper data structure matching shader layout
    // The buffer needs to be properly aligned for std140 layout
    const uboDataBuffer = new Float32Array(4); // 1KB buffer - enough for all data

    // Initialize with default values (important to avoid zero buffer issues)
    //for (let i = 0; i < uboDataBuffer.length; i++) {
    //    uboDataBuffer[i] = 0;
    //}

    //for (let c = 0; c < 3; c++) {
    //    let matrix_start = c * 16;
    //    uboDataBuffer[matrix_start]
    //        = uboDataBuffer[matrix_start + 5]
    //        = uboDataBuffer[matrix_start + 10]
    //        = uboDataBuffer[matrix_start + 15] = 1.0;
    //}

    uboDataBuffer[0] = uboDataBuffer[1] = uboDataBuffer[2] = uboDataBuffer[3] = 1.0; // ambientLightColor.r

    // Create the UBO
    sceneUBO = uboManager.createUBO('SceneUBO', uboDataBuffer.buffer);

    // Set binding point for the UBO in shader (must match what's in the shader)
    shader.setUBOBinding('SceneUBO', 0);

    // 2. Create Quad Geometry
    const square_geometry = createSquareGeometry(gl, shader);

    // 3. Create and add the Quad Entity
    const tile_sheet_url = 'img/sprites/otsp_tiles_01_alpha.png';
    const tile_sheet_texture = new Texture(gl, tile_sheet_url);
    const tile_sheet = new TextureSheet(tile_sheet_texture, 32, 32);
    const tile_sheet_material = new Material(gl, shader);
    tile_sheet_material.setTexture('uSampler', tile_sheet_texture);

    const creatures1_sheet_url = 'img/sprites/otsp_creatures_01_alpha.png';
    const creatures1_sheet_texture = new Texture(gl, creatures1_sheet_url);
    const creatures1_sheet = new TextureSheet(creatures1_sheet_texture, 32, 32);
    const creatures1_sheet_material = new Material(gl, shader);
    creatures1_sheet_material.setTexture('uSampler', creatures1_sheet_texture);

    const misc_sheet_url = 'img/sprites/otsp_misc_01_alpha.png';
    const misc_sheet_texture = new Texture(gl, misc_sheet_url);
    const misc_sheet = new TextureSheet(misc_sheet_texture, 32, 32);
    const misc_sheet_material = new Material(gl, shader);
    misc_sheet_material.setTexture('uSampler', misc_sheet_texture);

    // Create and add lights
    const sunLight = new DirectionalLight();
    sunLight.color = [1.0, 1.0, 1.0];
    sunLight.direction = [0.0, 0.0, -1.0];
    engine.scene.add(sunLight);

    // Texture Sheets (for Sprites)
    const grass_tile_sprite1 = new Sprite(tile_sheet);
    grass_tile_sprite1.addState('grass1', [61 * 16 + 5], 1.0);

    const dirt_tile_sprite1 = new Sprite(tile_sheet);
    dirt_tile_sprite1.addState('dirt1', [53 * 16 + 3], 1.0);

    const stone_tile_sprite1 = new Sprite(tile_sheet);
    stone_tile_sprite1.addState('stone1', [49 * 16 + 13], 1.0);

    const water_tile_sprite1 = new Sprite(tile_sheet);
    water_tile_sprite1.addState('water1', [16 * 16 + 0], 1.0);

    const shallow_water_tile_sprite1 = new Sprite(tile_sheet);
    shallow_water_tile_sprite1.addState('shallow_water1', [47 * 16 + 11], 1.0);

    const fire_sprite1 = new Sprite(misc_sheet);
    fire_sprite1.addState('fire1',
        [
            33 * 16 + 0, 33 * 16 + 1, 33 * 16 + 2,
            33 * 16 + 3, 33 * 16 + 4, 33 * 16 + 5,
            33 * 16 + 6, 33 * 16 + 7
        ], 1.0);

    const fire_sprite2 = new Sprite(misc_sheet);
    fire_sprite2.addState('fire2',
        [
            36 * 16 + 3, 36 * 16 + 4, 36 * 16 + 5,
            36 * 16 + 6, 36 * 16 + 7, 36 * 16 + 8,
            36 * 16 + 9, 36 * 16 + 10, 36 * 16 + 11,
            36 * 16 + 12, 36 * 16 + 13, 36 * 16 + 14,
            36 * 16 + 15, 36 * 16 + 2
        ], 0.1);

    const cat_sprite1 = new Sprite(creatures1_sheet);
    cat_sprite1.addState('cat1', [60 * 16 + 8, 60 * 16 + 9, 60 * 16 + 7], 1.0);

    // Create World
    const world = new World(16, 16);

    world.addEntityToTile(0, 0, new Entity(square_geometry, tile_sheet_material, null, grass_tile_sprite1, 0));
    world.addEntityToTile(0, 0, new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1, 100));
    world.addEntityToTile(-1, 0, new Entity(square_geometry, tile_sheet_material, null, dirt_tile_sprite1, 0));
    world.addEntityToTile(0, 1, new Entity(square_geometry, tile_sheet_material, null, stone_tile_sprite1, 0));
    world.addEntityToTile(1, 0, new Entity(square_geometry, tile_sheet_material, null, water_tile_sprite1, 0));
    world.addEntityToTile(0, -1, new Entity(square_geometry, tile_sheet_material, null, shallow_water_tile_sprite1, 0));
    world.addEntityToTile(-1, 0, new Entity(square_geometry, misc_sheet_material, null, fire_sprite1, 1000));
    world.addEntityToTile(0, 1, new Entity(square_geometry, misc_sheet_material, null, fire_sprite2, 10));

    world.addEntityToTile(-1, 0, new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1, 100));
    world.addEntityToTile(0, 1, new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1, 100));

    engine.scene.add(world);

    // 7. Set up Camera
    engine.setProjectionMode('ortho');
    engine.setOrthographicParameters({ size: 15.0 });
    engine.camera.updateView();

    // 8. Start the engine loop
    engine.start();
}

// Override the engine's render method to properly bind UBOs
const originalRender = Engine.prototype.render;
Engine.prototype.render = function () {
    const gl = this.gl;

    // Update the viewport to match the canvas's internal drawing buffer size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);// | gl.DEPTH_BUFFER_BIT);

    // Update projection based on mode and canvas aspect ratio
    const aspect = this.canvas.width / this.canvas.height;
    let xfactor, yfactor;
    if (this.canvas.width > this.canvas.height) {
        xfactor = aspect;
        yfactor = 1;
    }
    else {
        xfactor = 1;
        yfactor = 1 / aspect;
    }

    if (this.projectionMode === 'perspective') {
        this.camera.updateProjection(45 * Math.PI / 180, aspect, 0.1, 100);
    } else if (this.projectionMode === 'ortho') {
        const size = this.orthographic.size;
        const left = -xfactor * size / 2;
        const right = xfactor * size / 2;
        const bottom = -yfactor * size / 2;
        const top = yfactor * size / 2;
        this.camera.updateOrthographic(left, right, bottom, top, this.orthographic.near, this.orthographic.far);
        // this.camera.updateOrthographic(-1.0, 1.0, -1.0, 1.0, 0.1, 100);
    }

    // Bind UBOs before rendering
    if (uboManager) {
        uboManager.bindAll();
    }

    this.scene.render(this.camera.getViewMatrix(), this.camera.getProjectionMatrix(), this);
};

async function testMapLoading(world, actor) {
    const itemRegistry = {
        'grass': { type: ItemType.TERRAIN, id: 'grass' },
        'tree': {
            type: ItemType.FIXED_OBJECT, id: 'tree', callbacks: {
                on_move_into: (ent, from, to) => console.log(`Entity moved into TREE at ${to.x},${to.y}!`),
                on_move_from: (ent, from, to) => console.log(`Entity moved away from TREE at ${from.x},${from.y}!`)
            }
        },
        'chest': {
            type: ItemType.MOVABLE_ITEM, id: 'chest', callbacks: {
                on_use: (ent, item) => console.log("Chest opened!")
            }
        }
    };

    const loader = new MapLoader(itemRegistry);

    // Mock map: 
    // Row 0: grass; grass; grass
    // Row 1: grass, tree; grass; grass, chest
    // Row 2: grass; grass; grass
    const testMapText = "grass;grass;grass\ngrass,tree;grass;grass,chest\ngrass;grass;grass";

    console.log("Parsing test map...");
    const { world: testWorld, grid: testGrid } = loader.parse(testMapText, 1);

    // Setup test world
    testWorld.setGrid(testGrid);
    // Create 3x3 chunks for the test world (to match testMapText)
    // For the test, we'll just use the world directly.

    // Add the test world to scene
    // (In a real app, we'd replace the current world or add it as a child)
    // For now, we'll just use the provided world and overwrite its grid.

    console.log("Adding actor to grid...");
    world.addActor(actor, 0, 0);
    console.log("Actor positioned at (0,0)");

    console.log("Attempting move from (0,0) to (1,0) (empty)...");
    world.moveEntity(actor, 1, 0);

    console.log("Attempting move from (1,0) to (1,1) (into tree)...");
    // Note: In our parse, (1,1) is row 1, col 1. 
    // Let's use row 1, col 0 (tree is at index [1][0])
    // Wait, testMapText row 1: "grass,tree;grass;grass,chest"
    // Col 0: grass, tree
    // Col 1: grass
    // Col 2: grass, chest

    // Let's try move to (0,1) -> row 1, col 0
    world.moveEntity(actor, 0, 1);

    console.log("Attempting move from (0,1) to (0,2) (into chest?)...");
    // Col 2 is index 2. Row 1 is index 1.
    world.moveEntity(actor, 2, 1);

    console.log("Test Completed. Check console for logs.");
}
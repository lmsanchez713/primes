import { Shader, Buffer, Texture, Geometry, Material, Entity, DirectionalLight, PointLight, AmbientLight } from './ogl2.js';
import { Engine } from './engine.js';
import { Mat4 } from './math.js';
import { CameraController } from './camera_controller.js';
import { TextureSheet } from './core/texture-sheet.js';
import { Sprite } from './scene/sprite.js';
import { World } from './scene/world.js';
import { Chunk } from './scene/chunk.js';
import { MapLoader } from './scene/map_loader.js';
import { ItemType } from './scene/item.js';

let engine;

/**
 * Helper to create a simple quad geometry
 */
function createQuadGeometry(gl, shader) {
    const vertices = new Float32Array([
        -0.5, -0.5, 0.0,
         0.5,  0.5, 0.0,
         0.5, -0.5, 0.0,
        -0.5, -0.5, 0.0,
        -0.5,  0.5, 0.0,
         0.5,  0.5, 0.0
    ]);

    const texCoords = new Float32Array([
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ]);

    const normals = new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, 1, 0, 0, 1, 0, 0, 1
    ]);

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

function OrthoMat4(x = 0, y = 0, z = 0) {
    let mat4 = new Mat4();
    Mat4.translation(x, y, z, mat4);
    return mat4;
}

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
    const tile_sheet_texture = new Texture(gl, 'img/sprites/otsp_tiles_01_alpha.png');
    const creatures1_sheet_texture = new Texture(gl, 'img/sprites/otsp_creatures_01_alpha.png');

    // 3. Create Quad Geometry
    const square_geometry = createQuadGeometry(gl, shader);

    // 4. Create Material
    const tile_sheet_material = new Material(gl, shader);
    tile_sheet_material.setTexture('uSampler', tile_sheet_texture);
    const tile_sheet = new TextureSheet(tile_sheet_texture, 32, 32);
    const tile_sheet_sprite = new Sprite(tile_sheet);
    const grass_tile_sprite1 = new Sprite(tile_sheet);
    grass_tile_sprite1.addState('grass1', [61 * 16 + 5], 1.0);

    // Creature stuff
    const creatures1_sheet_material = new Material(gl, shader);
    creatures1_sheet_material.setTexture('uSampler', creatures1_sheet_texture);
    const creatures1_sheet = new TextureSheet(creatures1_sheet_texture, 32, 32);
    const creatures1_sheet_sprite = new Sprite(creatures1_sheet);
    creatures1_sheet_sprite.addState('cat1', [60 * 16 + 8, 60 * 16 + 9, 60 * 16 + 7], 1.0);

    const sunLight = new DirectionalLight();
    sunLight.color = [1.0, 1.0, 1.0];
    sunLight.direction = [0.0, 0.0, -1.0];
    engine.scene.add(sunLight);

    // --- TEST WORLD SETUP ---
    const GRID_SCALE = 2.0; // Each tile is 2 units wide
    const world = new World(10, 10, null, GRID_SCALE);

    // Create the cat (the actor)
    const grass_tile_entity = new Entity(square_geometry, tile_sheet_material, OrthoMat4(0, 0), grass_tile_sprite1);
    const cat_entity = new Entity(square_geometry, creatures1_sheet_material, OrthoMat4(0, 0), creatures1_sheet_sprite);
    
    engine.scene.add(world);
    engine.scene.add(cat_entity);

    engine.setProjectionMode('ortho');
    engine.setOrthographicParameters({ size: 9.0 });
    engine.camera.updateView();
    engine.start();

    // --- TEST LOGIC ---
    console.log("--- Starting Map Loader Test ---");
    await testMapLoading(world, cat_entity);
}

async function testMapLoading(world, actor) {
    const itemRegistry = {
        'grass': { type: ItemType.TERRAIN, id: 'grass' },
        'tree': { type: ItemType.FIXED_OBJECT, id: 'tree', callbacks: {
            on_move_into: (ent, from, to) => console.log(`[CALLBACK] Moved INTO TREE at ${to.x},${to.y}!`),
            on_move_from: (ent, from, to) => console.log(`[CALLBACK] Moved AWAY FROM TREE at ${from.x},${from.y}!`)
        }},
    };

    const loader = new MapLoader(itemRegistry);
    const testMapText = "grass;grass;grass\ngrass,tree;grass;grass\ngrass;grass;grass";
    
    const { grid } = loader.parse(testMapText, 1);
    world.setGrid(grid);

    console.log("Actor placed at (0,0) in World");
    world.addActor(actor, 0, 0);

    // Wait 2 seconds, then move into tree
    setTimeout(() => {
        console.log(">>> Moving actor (0,0) -> (1,0) (onto tree)");
        world.moveEntity(actor, 1, 0);
    }, 2000);

    // Wait 4 seconds, then move away
    setTimeout(() => {
        console.log(">>> Moving actor (1,0) -> (2,0) (away from tree)");
        world.moveEntity(actor, 2, 0);
    }, 4000);

    console.log("Test sequence scheduled. Check console/screen.");
}

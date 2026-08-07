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
    // Vertices for two triangles forming a quad
    const vertices = new Float32Array([
        -0.5, -0.5, 0.0, // v0
         0.5,  0.5, 0.0, // v1
         0.5, -0.5, 0.0, // v2
        -0.5, -0.5, 0.0, // v3
        -0.5,  0.5, 0.0, // v4
         0.5,  0.5, 0.0  // v5
    ]);

    // Texture coordinates
    const texCoords = new Float32Array([
        0.0, 0.0, // v0
        1.0, 1.0, // v1
        1.0, 0.0, // v2
        0.0, 0.0, // v3
        0.0, 1.0, // v4
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

function OrthoMat4(x = 0, y = 0, z = 0) {
    let mat4 = new Mat4();
    Mat4.translation(x, y, z, mat4);
    return mat4;
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
    const lumi_texture = new Texture(gl, 'img/lumi.png');
    const wood_box_texture = new Texture(gl, 'img/wood-box.png');
    const tile_sheet_texture = new Texture(gl, 'img/sprites/otsp_tiles_01_alpha.png');
    const creatures1_sheet_texture = new Texture(gl, 'img/sprites/otsp_creatures_01_alpha.png');

    // 3. Create Quad Geometry
    const square_geometry = createQuadGeometry(gl, shader);

    // 4. Create Material
    const wood_box_material = new Material(gl, shader);
    wood_box_material.setTexture('uSampler', wood_box_texture);

    // 5. Create and add the Quad Entity
    const square_entity = new Entity(square_geometry, wood_box_material);
    //engine.scene.add(square_entity);

    const tile_sheet_material = new Material(gl, shader);
    tile_sheet_material.setTexture('uSampler', tile_sheet_texture);
    const tile_sheet = new TextureSheet(tile_sheet_texture, 32, 32);

    const tile_sheet_sprite = new Sprite(tile_sheet);
    const arr = [];
    for (let c = 500; c < 1000; c++) {
        arr.push(c);
    }
    tile_sheet_sprite.addState('spritez', arr, 0.25); // 3 frames, 1 sec each
    const tile_entity = new Entity(square_geometry, tile_sheet_material, OrthoMat4(0, 0));
    tile_entity.sprite = tile_sheet_sprite;

    const creatures1_sheet_material = new Material(gl, shader);
    creatures1_sheet_material.setTexture('uSampler', creatures1_sheet_texture);
    const creatures1_sheet = new TextureSheet(creatures1_sheet_texture, 32, 32);

    const creatures1_sheet_sprite = new Sprite(creatures1_sheet);
    const arrr = [];
    for (let c = 16 * 64 - 1; c >= 16 * 32; c--) {
        arrr.push(c);
    }
    creatures1_sheet_sprite.addState('spritez', arrr, 0.25); // 3 frames, 1 sec each
    const creatures1_entity = new Entity(square_geometry, creatures1_sheet_material);
    creatures1_entity.sprite = creatures1_sheet_sprite;
    
    //const ambientLight = new AmbientLight([1.0, 1.0, 1.0]); // White light
    //engine.scene.add(ambientLight);

    const sunLight = new DirectionalLight();
    sunLight.color = [1.0, 1.0, 1.0];
    sunLight.direction = [0.0, 0.0, -1.0];
    engine.scene.add(sunLight);

    const grass_tile_sprite1 = new Sprite(tile_sheet);
    grass_tile_sprite1.addState('grass1', [61 * 16 + 5], 1.0);
    const grass_tile_entity = new Entity(square_geometry, tile_sheet_material, OrthoMat4(0, 0), grass_tile_sprite1);

    const cat_sprite1 = new Sprite(creatures1_sheet);
    cat_sprite1.addState('cat1', [60 * 16 + 8, 60 * 16 + 9, 60 * 16 + 7], 1.0);
    const cat_entity = new Entity(square_geometry, creatures1_sheet_material, OrthoMat4(0, 0), cat_sprite1);

    const world = new World(3, 3);
    function createChunk(transform = new Mat4()) {
        let chunk = new Chunk(3, 3, transform);
        chunk.addEntity(0, 0, new Entity(square_geometry, tile_sheet_material, OrthoMat4(-1, -1), grass_tile_sprite1));
        chunk.addEntity(1, 0, new Entity(square_geometry, tile_sheet_material, OrthoMat4(0, -1), grass_tile_sprite1));
        chunk.addEntity(2, 0, new Entity(square_geometry, tile_sheet_material, OrthoMat4(1, -1), grass_tile_sprite1));
        chunk.addEntity(0, 1, new Entity(square_geometry, tile_sheet_material, OrthoMat4(-1, 0), grass_tile_sprite1));
        chunk.addEntity(1, 1, new Entity(square_geometry, tile_sheet_material, OrthoMat4(0, 0), grass_tile_sprite1));
        chunk.addEntity(2, 1, new Entity(square_geometry, tile_sheet_material, OrthoMat4(1, 0), grass_tile_sprite1));
        chunk.addEntity(0, 2, new Entity(square_geometry, tile_sheet_material, OrthoMat4(-1, 1), grass_tile_sprite1));
        chunk.addEntity(1, 2, new Entity(square_geometry, tile_sheet_material, OrthoMat4(0, 1), grass_tile_sprite1));
        chunk.addEntity(2, 2, new Entity(square_geometry, tile_sheet_material, OrthoMat4(1, 1), grass_tile_sprite1));
        return chunk;
    }
    world.addChunk(0, 0, createChunk(OrthoMat4(0, 0)));

    // 1. Setup TextureSheet
    // const sheet = new TextureSheet(sprite_sheet_texture, 32, 32);

    // 2. Create Sprite for Fire
    // const fireSprite = new Sprite(sheet);
    // fireSprite.addState('loop', [0, 1, 2], 1.0); // 3 frames, 1 sec each

    // 3. Create Sprite for Creature
    // const creatureSprite = new Sprite(sheet);
    // Facing right, walking (indices 10, 11, 12)
    //creatureSprite.addState('idle', [5, 6], 1.0);
    //creatureSprite.addState('walk_right', [10, 11, 12], 0.2);
    //creatureSprite.setState('walk_right');

    // 4. Attach to Entity
    //const fireEntity = new Entity(square_geometry, wood_box_material);
    //fireEntity.sprite = fireSprite;
    //engine.scene.add(fireEntity);

    //const creatureEntity = new Entity(quadGeo, material);
    //creatureEntity.sprite = creatureSprite;
    //engine.scene.add(creatureEntity);

    // 7. Set up Camera
    engine.setProjectionMode('ortho');
    engine.setOrthographicParameters({ size: 9.0 });
    engine.camera.updateView();

    // engine.setController(new CameraController(engine.camera));
    //engine.scene.add(tile_entity);
    //engine.scene.add(creatures1_entity);
    //engine.scene.add(grass_tile_entity);
    engine.scene.add(world);
    engine.scene.add(cat_entity);

    // 8. Start the engine loop
    engine.start();

    // --- TEST NEW FEATURES ---
    console.log("--- Starting Map Loader Test ---");
    await testMapLoading(world, cat_entity);
}

async function testMapLoading(world, actor) {
    const itemRegistry = {
        'grass': { type: ItemType.TERRAIN, id: 'grass' },
        'tree': { type: ItemType.FIXED_OBJECT, id: 'tree', callbacks: {
            on_move_into: (ent, from, to) => console.log(`Entity moved into TREE at ${to.x},${to.y}!`),
            on_move_from: (ent, from, to) => console.log(`Entity moved away from TREE at ${from.x},${from.y}!`)
        }},
        'chest': { type: ItemType.MOVABLE_ITEM, id: 'chest', callbacks: {
            on_use: (ent, item) => console.log("Chest opened!")
        }}
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
    world.setGrid(testGrid);
    // We need to make sure world's dimensions match the test grid.
    // Since we can't easily resize World, we'll assume the test is small.
    // Let's just add the actor to the existing world's logic.
    
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

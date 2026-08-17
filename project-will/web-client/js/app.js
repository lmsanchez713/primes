import { Shader, Buffer, Texture, Geometry, Material, Entity, DirectionalLight, PointLight, AmbientLight } from './ogl2.js';
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
    const vsSource = await (await fetch('glsl/vtx_phong.glsl')).text();
    const fsSource = await (await fetch('glsl/frag_phong.glsl')).text();
    const shader = new Shader(gl, vsSource, fsSource);

    // 2. Create Quad Geometry
    const square_geometry = createSquareGeometry(gl, shader);

    // 3. Create and add the Quad Entity
    //const wood_box_material = new Material(gl, shader);
    //wood_box_material.setTexture('uSampler', 'img/wood-box.png');
    //const square_entity = new Entity(square_geometry, wood_box_material);
    //engine.scene.add(square_entity);

    // Texture Sheets (for Sprites)
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

    // We still need the actual textures for the TextureSheet/Sprite logic 
    // because they need the pixel data immediately to calculate UVs/Atlas.
    // But for standard Material textures, we use the URL lazy loading.

    const sunLight = new DirectionalLight();
    sunLight.color = [1.0, 1.0, 1.0];
    sunLight.direction = [0.0, 0.0, -1.0];
    engine.scene.add(sunLight);

    // Sprites / Entities
    const grass_tile_sprite1 = new Sprite(tile_sheet);
    grass_tile_sprite1.addState('grass1', [61 * 16 + 5], 1.0);
    //new Entity(square_geometry, tile_sheet_material, null, grass_tile_sprite1)

    const dirt_tile_sprite1 = new Sprite(tile_sheet);
    dirt_tile_sprite1.addState('dirt1', [53 * 16 + 3], 1.0);
    //new Entity(square_geometry, tile_sheet_material, null, dirt_tile_sprite1)

    const stone_tile_sprite1 = new Sprite(tile_sheet);
    stone_tile_sprite1.addState('stone1', [49 * 16 + 13], 1.0);
    //new Entity(square_geometry, tile_sheet_material, null, stone_tile_sprite1)

    const water_tile_sprite1 = new Sprite(tile_sheet);
    water_tile_sprite1.addState('water1', [16 * 16 + 0], 1.0);
    //new Entity(square_geometry, tile_sheet_material, null, water_tile_sprite1)

    const shallow_water_tile_sprite1 = new Sprite(tile_sheet);
    shallow_water_tile_sprite1.addState('shallow_water1', [47 * 16 + 11], 1.0);
    //new Entity(square_geometry, tile_sheet_material, null, shallow_water_tile_sprite1)

    const fire_sprite1 = new Sprite(misc_sheet);
    fire_sprite1.addState('fire1',
        [
            33 * 16 + 0, 33 * 16 + 1, 33 * 16 + 2,
            33 * 16 + 3, 33 * 16 + 4, 33 * 16 + 5,
            33 * 16 + 6, 33 * 16 + 7
        ], 1.0);
    //new Entity(square_geometry, misc_sheet_material, null, fire_sprite1)

    const fire_sprite2 = new Sprite(misc_sheet);
    fire_sprite2.addState('fire2',
        [
            36 * 16 + 3, 36 * 16 + 4, 36 * 16 + 5,
            36 * 16 + 6, 36 * 16 + 7, 36 * 16 + 8,
            36 * 16 + 9, 36 * 16 + 10, 36 * 16 + 11,
            36 * 16 + 12, 36 * 16 + 13, 36 * 16 + 14,
            36 * 16 + 15, 36 * 16 + 2
        ], 0.1);
    //new Entity(square_geometry, misc_sheet_material, null, fire_sprite2)

    const cat_sprite1 = new Sprite(creatures1_sheet);
    cat_sprite1.addState('cat1', [60 * 16 + 8, 60 * 16 + 9, 60 * 16 + 7], 1.0);
    //new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1)

    //const world = new World(3, 3);
    const world = new World(16, 16);

    //for (let x = -8; x <= 8; x++) {
    //    for (let y = -8; y <= 8; y++) {
    //        if ((x + y) % 2 === 0)
    //            world.addEntityToTile(x, y, new Entity(square_geometry, tile_sheet_material, null, grass_tile_sprite1));
    //    }
    //}

    engine.scene.add(world);

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
    //world.addEntityToTile(1, 0, new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1, 100));
    //world.addEntityToTile(0, -1, new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1, 100));
    //world.addEntityToTile(1, 1, new Entity(square_geometry, creatures1_sheet_material, null, cat_sprite1, 100));

    // engine.setSortFunction(function (a, b) {});

    //engine.scene.add(new Entity(square_geometry, creatures1_sheet_material, new Mat4(), cat_sprite1));

    //const entt = new Entity();
    //entt.children.push(new Entity(square_geometry, tile_sheet_material, new Mat4(), grass_tile_sprite1));
    //entt.children.push(new Entity(square_geometry, creatures1_sheet_material, new Mat4(), cat_sprite1));
    //engine.scene.add(entt);

    // Create Sprite for Fire
    // const fireSprite = new Sprite(sheet);
    // fireSprite.addState('loop', [0, 1, 2], 1.0); // 3 frames, 1 sec each

    // Attach to Entity
    //const fireEntity = new Entity(square_geometry, wood_box_material);
    //fireEntity.sprite = fireSprite;
    //engine.scene.add(fireEntity);

    // Create Sprite for Creature
    // const creatureSprite = new Sprite(sheet);
    // Facing right, walking (indices 10, 11, 12)
    //creatureSprite.addState('idle', [5, 6], 1.0);
    //creatureSprite.addState('walk_right', [10, 11, 12], 0.2);
    //creatureSprite.setState('walk_right');

    //const creatureEntity = new Entity(quadGeo, material);
    //creatureEntity.sprite = creatureSprite;
    //engine.scene.add(creatureEntity);

    // 7. Set up Camera
    engine.setProjectionMode('ortho');
    //engine.setOrthographicParameters({ size: 9.0 });
    engine.setOrthographicParameters({ size: 15.0 });
    engine.camera.updateView();

    // engine.setController(new CameraController(engine.camera));
    //engine.scene.add(tile_entity);
    //engine.scene.add(creatures1_entity);
    //engine.scene.add(grass_tile_entity);
    //engine.scene.add(new Entity(square_geometry, creatures1_sheet_material, OrthoMat4(0, 0), cat_sprite1));

    // 8. Start the engine loop
    engine.start();

    // --- TEST NEW FEATURES ---
    //console.log("--- Starting Map Loader Test ---");
    //await testMapLoading(world, cat_entity);
}

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

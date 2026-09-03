import { Primitive_Engine, Primitive } from './primitive.js';
import { Primitive_Scene, Primitive_Camera } from './core/scene.js';
import { loadShaderFromUrl } from './core/shader.js';
import { createCubeGeometry, generate_triangle, generate_sphere } from './core/shapes.js';
import { Buffer } from './core/buffer.js';
import { Texture } from './core/texture.js';
import { Mat4, Vec3 } from './math.js';
import { UniformBuffer } from './core/ubo.js';


let engine, scene;

let vertices_generated = 0, last_report = -1;

const waves = [];

function update_geometry() {
    const cycle_time = 1.0;
    const current_cycle = Math.trunc(engine.time.current / cycle_time);
    const cycle_partial = engine.time.current % cycle_time;
    let quads = 1, side = 1, vertices_needed = 6;

    for (let c = 0; c <= current_cycle; c++) {
        const new_side = side + 2;
        const new_quads = new_side * 2 + side * 2;
        vertices_needed += new_quads * 6;
        quads += new_quads;
        side = new_side;
    }

    //if (last_report < current_cycle) {
    //    console.log(
    //        `C ${current_cycle} Q ${quads} S ${side} V ${vertices_needed} A ${scene.cameras[0].perspective.aspect}`
    //    );
    //    last_report = current_cycle;
    //}

    const geo = engine.geometries['square'];

    if (vertices_needed > vertices_generated) {
        const vertices_missing = vertices_needed - vertices_generated;
        geo.add_buffer_data({
            aPosition: new Float32Array(vertices_missing * 3),
            aNormal: new Float32Array(vertices_missing * 3),
            aTexCoord: new Float32Array(vertices_missing * 2)
        });
        vertices_generated = vertices_needed;
    }

    //y=Asin(kx−ωt+ϕ)   //   y(x,z,t) = Asin(kx+kz-wt+o)
    function y(x, z, t, a, kx, kz, w, o) {
        return a * Math.sin(kx * Math.PI * 2.0 * x + kz * Math.PI * 2.0 * z - w * t + o);
    }
    //update existent geometry
    const geo_offset = 36;
    const position = new Float32Array(vertices_generated * 3),
        normal = new Float32Array(vertices_generated * 3),
        texture = new Float32Array(vertices_generated * 2);

    const u0 = (1.0 / 24.0) * 22.0, v0 = (1.0 / 16.0) * 12.0, u1 = (1.0 / 24.0) * 23.0, v1 = (1.0 / 16.0) * 13.0;
    // const u0 = (1.0 / 24.0) * 13.0, v0 = (1.0 / 16.0) * 3.0, u1 = (1.0 / 24.0) * 14.0, v1 = (1.0 / 16.0) * 4.0;
    const factor_left = 1.0 - (cycle_partial / cycle_time);

    for (let quad_row = 0; quad_row < side; quad_row++) {
        for (let quad_col = 0; quad_col < side; quad_col++) {

            let
                x0 = -side / 2.0 + quad_col * 1.0,
                x1 = -side / 2.0 + quad_col * 1.0 + 1.0,
                z0 = side / 2.0 - quad_row * 1.0,
                z1 = side / 2.0 - quad_row * 1.0 - 1.0;

            let y0 = 0.0, y1 = 0.0, y2 = 0.0, y3 = 0.0;

            for (const wave of waves) {
                y0 += y(x0, z0, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
                y1 += y(x1, z0, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
                y2 += y(x1, z1, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
                y3 += y(x0, z1, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
            }

            if (quad_row == 0 || quad_row == side - 1 || quad_col == 0 || quad_col == side - 1) {
                const sine_factor_left = Math.sin(Math.PI / 2.0 * factor_left);
                const xf = (Math.sin(engine.time.current + x0) + Math.cos(engine.time.current + z0)) * sine_factor_left;
                const zf = (Math.cos(engine.time.current + x0) - Math.sin(engine.time.current + z0)) * sine_factor_left;
                const yf = 2.0 * sine_factor_left;
                const sf = 0.5 * sine_factor_left;
                x0 += xf + sf, z0 += zf - sf, x1 += xf - sf, z1 += zf + sf;
                y0 += yf, y1 += yf, y2 += yf, y3 += yf;
            }

            const buffer_offset = (quad_row * side + quad_col) * 6;
            generate_triangle(
                x0, y0, z0, u0, v0,
                x1, y1, z0, u1, v0,
                x1, y2, z1, u1, v1,
                buffer_offset, position, normal, texture);
            generate_triangle(
                x0, y0, z0, u0, v0,
                x1, y2, z1, u1, v1,
                x0, y3, z1, u0, v1,
                buffer_offset + 3, position, normal, texture);
        }
    }

    geo.buffer_sub_data({
        aPosition: { data: position, offset: 36 * 3 * 4 },
        aNormal: { data: normal, offset: 36 * 3 * 4 },
        aTexCoord: { data: texture, offset: 36 * 2 * 4 }
    });
}

export async function InitApp() {
    const canvas = document.getElementById('glCanvas');
    engine = new Primitive_Engine(canvas);
    if (!engine.gl) return;
    const gl = engine.gl;

    const debug_shader = await loadShaderFromUrl(engine, 'glsl/vertex.glsl', 'glsl/fragment.glsl',
        ['aPosition', 'aTexCoord', 'aNormal'], ['u_sampler2d'], ['UBO']);

    const square = engine.geometries['square'] = createCubeGeometry(engine, true);

    console.log(`generate_sphere ${generate_sphere(1.0, 3, 3)}`);

    square.addShader('debug_shader', debug_shader);
    square.updateBindings();

    const max_lights = 32;

    const ubo_buffer = new UniformBuffer(engine, 'UBO', [
        { name: 'u_modelMatrix', type: 'mat4' },
        { name: 'u_viewMatrix', type: 'mat4' },
        { name: 'u_projectionMatrix', type: 'mat4' },
        { name: 'u_pointLight', type: 'vec4', count: max_lights },
        { name: 'u_pointLightPos', type: 'vec4', count: max_lights },
        { name: 'u_ambientLight', type: 'vec4' },
        { name: 'u_cameraPosition', type: 'vec3' },
        { name: 'u_pointLightCount', type: 'uint' },
        { name: 'u_time', type: 'float' }
    ]);
    debug_shader.bind_ubo(ubo_buffer);

    // const texture = new Texture(engine, 'img/sprites/otsp_tiles_01_alpha.png');
    const texture = new Texture(engine, 'img/sprites/minecraft_world.png', 0);
    const texture2 = new Texture(engine, 'img/sprites/otsp_creatures_01_alpha.png', 0);

    scene = new Primitive_Scene(engine, {
        cameras: [
            new Primitive_Camera(engine, { view: { position: new Vec3(3.0, 3.0, 5.0) }, perspective: {} })
        ]
    });

    for (let c = 0; c < 5; c++) {
        const a = 0.3 + Math.sin(Math.PI / 2.0 * Math.random()) / 3.0,
            rad = Math.random() * 2.0 * Math.PI,
            kx = 0.5 + Math.sin(rad) * 0.5, kz = 0.5 + Math.cos(rad) * 0.5,
            w = 3.0 + Math.random() * 3.0,
            o = Math.random() * 2.0 * Math.PI;

        waves.push({ a, kx, kz, w, o });
    }

    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            scene.cameras[0].mouse_delta_x += e.movementX;
            scene.cameras[0].mouse_delta_y += e.movementY;
        }
    });

    window.addEventListener('click', () => {
        if (!document.pointerLockElement && document.body.requestPointerLock) {
            document.body.requestPointerLock()?.catch?.(() => { });
        }
    });

    let touch_active = false, last_touch_x = 0, last_touch_y = 0;

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { touch_active = false; return; }
        touch_active = true;
        last_touch_x = e.touches[0].clientX;
        last_touch_y = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!touch_active || e.touches.length !== 1) return;
        e.preventDefault(); // stop page scroll/zoom while rotating
        const t = e.touches[0];
        scene.cameras[0].mouse_delta_x += (t.clientX - last_touch_x);
        scene.cameras[0].mouse_delta_y += (t.clientY - last_touch_y);
        last_touch_x = t.clientX;
        last_touch_y = t.clientY;
    }, { passive: false });  // required: allows preventDefault()

    window.addEventListener('touchend', () => { touch_active = false; });

    engine.primitives.push(new Primitive(engine, {
        draw_algorithm: (primitive) => {
            update_geometry();
            //const camera_factor = 0.03125 * 1.0;
            //scene.cameras[0].view.position.x *= (1.0 + camera_factor * engine.time.delta);
            //scene.cameras[0].view.position.y *= (1.0 + camera_factor * engine.time.delta);
            //scene.cameras[0].view.position.z *= (1.0 + camera_factor * engine.time.delta);
            square.updateBindings();
            square.bind('debug_shader');
            ubo_buffer.bind_base(debug_shader);
            texture.bind();
            debug_shader.uniform1i('u_sampler2d', 0);
            
            const light_intensity = 25.0;// Math.sin(engine.time.current * 2.666667) * 0.5 + 0.5;
            const t = engine.time.current;
            ubo_buffer.set_many({
                u_ambientLight: [0.3, 0.3, 0.3, 1.0],
                u_cameraPosition: [
                    scene.cameras[0].view.position.x,
                    scene.cameras[0].view.position.y,
                    scene.cameras[0].view.position.z,
                    1.0],
                u_pointLightCount: 2,
                u_time: t
            });
            ubo_buffer.set('u_pointLight', [1.0, 1.0, 1.0, light_intensity], 0);
            ubo_buffer.set('u_pointLight', [1.0, 1.0, 1.0, light_intensity], 1);
            ubo_buffer.set('u_pointLightPos', [5.0 * Math.cos(t), 0.0, 5.0 * Math.sin(t), 1.0], 0);
            ubo_buffer.set('u_pointLightPos', [0.0, 5.0 * Math.cos(t * 4.0), 5.0 * Math.sin(t * 4.0), 1.0], 1);

            const model_matrix = new Mat4();
            //, view_matrix = new Mat4(), projection_matrix = new Mat4();
            //const camera = { position: new Vec3(0.0, 0.0, 5.0), target: new Vec3(0.0, 0.0, 0.0), up: new Vec3(0.0, 1.0, 0.0) };
            //Mat4.lookAt(camera.position, camera.target, camera.up, view_matrix);
            //Mat4.perspective(45 * Math.PI / 180, engine.canvas.width / engine.canvas.height, 0.1, 100, projection_matrix);
            // Mat4.ortho(-3.0, 3.0, -2.0, 2.0, 0.1, 100, projection_matrix);

            //const time_rotation = new Mat4(), translation = new Mat4(), rotation = new Mat4(),
            //    rotationX = new Mat4(), rotationY = new Mat4(), rotationZ = new Mat4();
            // Mat4.rotateY(-engine.time.current / 2.0, time_rotation);
            //Mat4.translation(0.0, 0.0, 0.5, translation);
            //Mat4.rotateY(Math.PI / 2.0, rotationY);
            // model_matrix.multiply(time_rotation);
            // model_matrix.multiply(translation);
            const TOUCH = window.matchMedia('(pointer: coarse)').matches;
            scene.cameras[0].process_input(TOUCH ? 0.005 : 0.0025);
            scene.cameras[0].update_view_and_projection();

            ubo_buffer.set_many({
                u_modelMatrix: scene.model_matrix,
                u_viewMatrix: scene.cameras[0].view_matrix,
                u_projectionMatrix: scene.cameras[0].projection_matrix
            });

            engine.gl.drawArrays(engine.gl.TRIANGLES, 0, 36);
            if (vertices_generated) {
                engine.gl.drawArrays(engine.gl.TRIANGLES, 36, vertices_generated);
            }
        }
    }));

    engine.start();
}
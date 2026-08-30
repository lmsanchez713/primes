import { Primitive_Engine, Primitive } from './primitive.js';
import { Primitive_Scene, Primitive_Camera } from './core/scene.js';
import { loadShaderFromUrl } from './core/shader.js';
import { createCubeGeometry, generate_triangle } from './core/shapes.js';
import { Buffer } from './core/buffer.js';
import { Texture } from './core/texture.js';
import { Mat4, Vec3 } from './math.js';

let engine;

let sea;

let vertices_generated = 0;

function update_geometry() {
    //y=Asin(kx−ωt+ϕ)   //   y(x,z,t) = Asin(kx+kz-wt+o)
    function y(x, z, t, a, kx, kz, w, o) {
        return a * Math.sin(kx * Math.PI * 2.0 * x + kz * Math.PI * 2.0 * z - w * t + o);
    }
    //update existent geometry
    const geo = engine.geometries['square'];
    const geo_offset = 36;
    const position = new Float32Array(18), normal = new Float32Array(18), texture = new Float32Array(12);

    const y0 = y(-1.0, 1.0, engine.time.current, 0.5, 1.0, 1.3, 1.0, 0.0);
    const y1 = y(1.0, 1.0, engine.time.current, 0.5, 1.0, 1.3, 1.0, 0.0);
    const y2 = y(1.0, -1.0, engine.time.current, 0.5, 1.0, 1.3, 1.0, 0.0);
    const y3 = y(-1.0, -1.0, engine.time.current, 0.5, 1.0, 1.3, 1.0, 0.0);

    generate_triangle(
        -1.0, y0, 1.0, 0.0, 0.0,
        1.0, y1, 1.0, 1.0, 0.0,
        1.0, y2, -1.0, 1.0, 1.0,
        0, position, normal, texture);
    generate_triangle(
        -1.0, y0, 1.0, 0.0, 0.0,
        1.0, y2, -1.0, 1.0, 1.0,
        -1.0, y3, -1.0, 0.0, 1.0,
        3, position, normal, texture);

    geo.buffer_sub_data({
        aPosition: { data: position, offset: 36 * 3 * 4 },
        aNormal: { data: normal, offset: 36 * 3 * 4 },
        aTexCoord: { data: texture, offset: 36 * 2 * 4 }
    });

    vertices_generated = 6;
}

export async function InitApp() {
    const canvas = document.getElementById('glCanvas');
    engine = new Primitive_Engine(canvas);
    if (!engine.gl) return;
    const gl = engine.gl;

    const debug_shader = await loadShaderFromUrl(engine, 'glsl/vertex.glsl', 'glsl/fragment.glsl',
        ['aPosition', 'aTexCoord', 'aNormal'], ['u_sampler2d'], ['UBO']);

    const square = engine.geometries['square'] = createCubeGeometry(engine, true);
    square.add_buffer_data({ aPosition: new Float32Array(18), aNormal: new Float32Array(18), aTexCoord: new Float32Array(12) });
    square.addShader('debug_shader', debug_shader);
    square.updateBindings();

    const max_lights = 32;

    const ubo_float_count = 16 * 3 + 4 * 32 * 2 + 4 + 1 + 1;
    const ubo_buffer = new Buffer(engine, gl.UNIFORM_BUFFER, new Float32Array(ubo_float_count), gl.DYNAMIC_DRAW, false, 'UBO', 0);
    debug_shader.bind_ubo(ubo_buffer);

    // const texture = new Texture(engine, 'img/sprites/otsp_tiles_01_alpha.png');
    const texture = new Texture(engine, 'img/sprites/minecraft_world.png', 0);
    const texture2 = new Texture(engine, 'img/sprites/otsp_creatures_01_alpha.png', 0);

    const scene = new Primitive_Scene(engine, {
        cameras: [
            new Primitive_Camera(engine, { view: { position: new Vec3(3.0, 3.0, 5.0) }, perspective: {} })
        ]
    });

    engine.primitives.push(new Primitive(engine, {
        draw_algorithm: (primitive) => {
            update_geometry();
            square.updateBindings();
            square.bind('debug_shader');
            ubo_buffer.bind_base(debug_shader);
            texture.bind();
            debug_shader.uniform1i('u_sampler2d', 0);
            ubo_buffer.subdata(new Float32Array([engine.time.current]), (ubo_float_count - 1) * 4);

            const light_intensity = 25.0;// Math.sin(engine.time.current * 2.666667) * 0.5 + 0.5;
            const light_color = new Float32Array([1.0, 1.0, 1.0, light_intensity]);
            const ambient_light_offset = 16 * 3 * 4;
            ubo_buffer.subdata(new Float32Array([0.3, 0.3, 0.3, 1.0]), ambient_light_offset);
            const diffuse_light_offset = (16 * 3 + 4) * 4;
            ubo_buffer.subdata(light_color, diffuse_light_offset);
            ubo_buffer.subdata(light_color, diffuse_light_offset + 16);
            // ubo_buffer.subdata(light_color, diffuse_light_offset + 8);
            const diffuse_light_pos_offset = (16 * 3 + 4 + 4 * max_lights) * 4;
            ubo_buffer.subdata(new Float32Array([5.0 * Math.cos(engine.time.current), 0.0,
            5.0 * Math.sin(engine.time.current), 1.0]), diffuse_light_pos_offset);
            ubo_buffer.subdata(new Float32Array([0.0, 5.0 * Math.cos(engine.time.current * 4.0),
                5.0 * Math.sin(engine.time.current * 4.0), 1.0]), diffuse_light_pos_offset + 16);
            const diffuse_light_count_offset = (16 * 3 + 4 + 8 * max_lights) * 4;
            ubo_buffer.subdata(new Uint32Array([2]), diffuse_light_count_offset);

            const model_matrix = new Mat4();
            //, view_matrix = new Mat4(), projection_matrix = new Mat4();
            //const camera = { position: new Vec3(0.0, 0.0, 5.0), target: new Vec3(0.0, 0.0, 0.0), up: new Vec3(0.0, 1.0, 0.0) };
            //Mat4.lookAt(camera.position, camera.target, camera.up, view_matrix);
            //Mat4.perspective(45 * Math.PI / 180, engine.canvas.width / engine.canvas.height, 0.1, 100, projection_matrix);
            // Mat4.ortho(-3.0, 3.0, -2.0, 2.0, 0.1, 100, projection_matrix);

            const time_rotation = new Mat4(), translation = new Mat4(), rotation = new Mat4(),
                rotationX = new Mat4(), rotationY = new Mat4(), rotationZ = new Mat4();
            // Mat4.rotateY(-engine.time.current / 2.0, time_rotation);
            //Mat4.translation(0.0, 0.0, 0.5, translation);
            //Mat4.rotateY(Math.PI / 2.0, rotationY);
            // model_matrix.multiply(time_rotation);
            // model_matrix.multiply(translation);
            scene.cameras[0].update_view_and_projection();
            const matrix_array = new Float32Array([
                ...scene.model_matrix.data, ...scene.cameras[0].view_matrix.data, ...scene.cameras[0].projection_matrix.data
            ]);
            ubo_buffer.subdata(matrix_array);
            if (vertices_generated)
                engine.gl.drawArrays(engine.gl.TRIANGLES, 36, vertices_generated);
            //texture.bind(0);
            //texture2.bind(1);
            //debug_shader.uniform1i('u_sampler2d', 0);
            //square.drawObject('square');
            //debug_shader.uniform1i('u_sampler2d', 1);
            //square.drawObject('square');
            //model_matrix.identity();
            //model_matrix.multiply(rotation);
            //model_matrix.multiply(rotationY);
            //model_matrix.multiply(translation);
            //ubo_buffer.subdata(model_matrix.data);
            //square.drawObject('square');

            //const factor = (Math.sin(engine.time.current) + 1.0) / 2.0;
            //engine.gl.drawArrays(engine.gl.TRIANGLES, 0, 6);
            //function updateMatrices(x, y, z, axis, angle, factor = 1.0, matrix = new Mat4()) {
            //    if (factor < 0.0) factor = 0.0;
            //    if (factor > 1.0) factor = 1.0;
            //    model_matrix.copy(matrix);
            //    model_matrix.multiply(time_rotation);
            //    Mat4.translation(-x, -y, -z, translation);
            //    model_matrix.multiply(translation);
            //    Mat4.rotateAxis(axis, angle * factor, rotation);
            //    model_matrix.multiply(rotation);
            //    Mat4.translation(x, y, z, translation);
            //    model_matrix.multiply(translation);
            //    ubo_buffer.subdata(model_matrix.data);
            //}
            //updateMatrices(-0.5, 0.0, -0.5, new Vec3(0.0, 1.0, 0.0), Math.PI / 2.0, factor);
            //engine.gl.drawArrays(engine.gl.TRIANGLES, 6, 6);
            //updateMatrices(0.0, -0.5, -0.5, new Vec3(-1.0, 0.0, 0.0), Math.PI / 2.0, factor);
            //engine.gl.drawArrays(engine.gl.TRIANGLES, 12, 6);
            //updateMatrices(0.5, 0.0, -0.5, new Vec3(0.0, -1.0, 0.0), Math.PI / 2.0, factor);
            //engine.gl.drawArrays(engine.gl.TRIANGLES, 18, 6);
            //updateMatrices(0.0, 0.5, -0.5, new Vec3(1.0, 0.0, 0.0), Math.PI / 2.0, factor);
            //engine.gl.drawArrays(engine.gl.TRIANGLES, 24, 6);
            //updateMatrices(0.0, 0.5, -0.5, new Vec3(1.0, 0.0, 0.0), Math.PI / 2.0);
            //updateMatrices(0.0, 0.5, -0.5, new Vec3(1.0, 0.0, 0.0), Math.PI / 2.0, 1.0, model_matrix);
            //engine.gl.drawArrays(engine.gl.TRIANGLES, 30, 6);
        }
    }));

    engine.start();
}
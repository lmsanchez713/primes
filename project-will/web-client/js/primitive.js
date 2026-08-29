import { Primitive_Scene, Primitive_Camera } from '/js/core/scene.js';

function draw_primitive(primitive, parent) {
    //console.log(primitive);
    if (!primitive.enabled) return;
}

export class Primitive {
    constructor(engine, parameters = {}) {
        this.engine = engine;
        this.name = parameters.name ?? "";
        this.geometry = parameters.geometry ?? null;
        this.shader_name = parameters.shader_name ?? null;
        this.ubo_buffer = parameters.ubo_buffer ?? null;
        this.uniform_blocks = parameters.uniform_blocks ?? null;
        this.engine_flags = parameters.engine_flags ?? null;
        this.draw_intervals = parameters.draw_intervals ?? null;
        this.draw_algorithm = parameters.draw_algorithm ?? draw_primitive;
        this.enabled = parameters.enabled ?? true;
        this.children = parameters.children ?? [];
    }
    render(parent) {
        this.draw_algorithm(this, parent);
    }
}

export class Primitive_Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }
        this.is_running = false;
        this.primitives = [];
        this.shaders = {};
        this.geometries = {};
        this.time = { current: 0.0, last: 0.0, delta: 0.0 };
    }

    start() {
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.DEPTH_TEST); // Added depth test

        this.is_running = true;
        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.is_running = false;
    }

    _loop(timestamp) {
        //console.log("Loop timestamp:", timestamp);
        if (!this.is_running) return;

        this.time.current = timestamp / 1000;
        this.time.delta = this.time.current - this.time.last;

        this.render();

        this.time.last = this.time.current;

        requestAnimationFrame(this._loop);
    }

    render() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Update projection based on mode and canvas aspect ratio
        const aspect = this.canvas.width / this.canvas.height;
        for (const primitive of this.primitives) {
            primitive.render();
        }
    }
}
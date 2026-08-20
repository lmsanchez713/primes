function draw_primitive(primitive) {
    //console.log(primitive);
    if (!primitive.enabled) return;
}

export class Primitive {
    constructor(engine, parameters = {}) {
        this.engine = engine;
        this.name = parameters.name ?? "";
        this.shader_program = parameters.shader_program ?? null;
        this.vao = parameters.vao ?? null;
        this.uniforms = parameters.uniforms ?? null;
        this.uniform_blocks = parameters.uniform_blocks ?? null;
        this.engine_flags = parameters.engine_flags ?? null;
        this.draw_intervals = parameters.draw_intervals ?? null;
        this.draw_algorithm = parameters.draw_algorithm ?? draw_primitive;
        this.enabled = parameters.enabled ?? true;
        this.children = parameters.children ?? [];
    }
    render() {
        this.draw_algorithm(this);
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
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);// | gl.DEPTH_BUFFER_BIT);

        // Update projection based on mode and canvas aspect ratio
        const aspect = this.canvas.width / this.canvas.height;
        for (const primitive of this.primitives) {
            primitive.render();
        }
    }
}
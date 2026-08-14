import { Scene } from './ogl2.js';
import { AssetManager } from './asset-manager.js';
import { Camera } from './camera.js';

class GLStateCache {
    constructor(gl) {
        this.gl = gl;
        this.currentProgram = null;
        this.currentVAO = null;
        this.boundTextures = {}; // e.g. { [gl.TEXTURE0]: textureObj }
    }

    useProgram(program) {
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
    }

    bindVertexArray(vao) {
        if (this.currentVAO !== vao) {
            this.gl.bindVertexArray(vao);
            this.currentVAO = vao;
        }
    }

    bindTexture(unit, target, texture) {
        if (this.boundTextures[unit] !== texture) {
            this.gl.activeTexture(unit);
            this.gl.bindTexture(target, texture);
            this.boundTextures[unit] = texture;
        }
    }
}

export class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.disable(this.gl.DEPTH_TEST); // Added depth test
        // this.gl.enable(this.gl.DEPTH_TEST); // Added depth test

        this.scene = new Scene(this.gl);
        this.assets = new AssetManager();
        this.camera = new Camera(); 
        this.controller = null;
        this.isRunning = false;
        this.projectionMode = 'perspective'; // 'perspective' or 'ortho'
        this.lastTimestamp = 0;

        window.addEventListener('resize', () => {
            // Update the drawing buffer to match the CSS display size
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        this.orthographic = { left: -1.0, right: 1.0, bottom: -1.0, top: 1.0, near: 0.1, far: 100.0, size: 1.0 };

        this.state = new GLStateCache(this.gl);

        this.sort_function = (a, b) => a.priority - b.priority;

    }

    setSortFunction(sortFunction) {
        this.sort_function = sortFunction;
    }

    setOrthographicParameters(params) {
        for (const key in params) {
            if (this.orthographic.hasOwnProperty(key)) {
                this.orthographic[key] = params[key];
            }
        }
    }

    setController(controller) {
        this.controller = controller;
    }

    start() {
        this.isRunning = true;
        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.isRunning = false;
    }

    setProjectionMode(mode) {
        if (mode === 'perspective' || mode === 'ortho') {
            this.projectionMode = mode;
        } else {
            console.error("Invalid projection mode: " + mode);
        }
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 0;
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this._loop);
    }

    update(deltaTime) {
        if (this.controller) {
            this.controller.update(deltaTime);
        } else {
            this.camera.updateView();
        }
        this.scene.update(deltaTime);
    }

    render() {
        const gl = this.gl;

        // 1. Update the viewport to match the canvas's internal drawing buffer size
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

        this.scene.render(this.camera.getViewMatrix(), this.camera.getProjectionMatrix(), this);
    }

}

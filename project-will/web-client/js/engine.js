import { Scene } from './ogl2.js';
import { AssetManager } from './asset-manager.js';
import { Camera } from './camera.js';

export class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.DEPTH_TEST); // Added depth test

        this.scene = new Scene(this.gl);
        this.assets = new AssetManager();
        this.camera = new Camera(); 
        this.isRunning = false;
        this.projectionMode = 'perspective'; // 'perspective' or 'ortho'
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

    _loop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        requestAnimationFrame(this._loop);
    }

    update() {
        // Logic updates (physics, input, etc.) could go here
        this.camera.updateView();
    }

    render() {
        const gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Update projection based on mode and canvas aspect ratio
        const aspect = this.canvas.width / this.canvas.height;

        if (this.projectionMode === 'perspective') {
            this.camera.updateProjection(45 * Math.PI / 180, aspect, 0.1, 100);
        } else if (this.projectionMode === 'ortho') {
            // Use a fixed orthographic view size for now
            const size = 2.0;
            const left = -aspect * size / 2;
            const right = aspect * size / 2;
            const bottom = -size / 2;
            const top = size / 2;
            this.camera.updateOrthographic(left, right, bottom, top, 0.1, 100);
        }

        this.scene.render(this.camera.getViewMatrix(), this.camera.getProjectionMatrix());
    }
}

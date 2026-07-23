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
    }

    start() {
        this.isRunning = true;
        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    stop() {
        this.isRunning = false;
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

        // Update projection if canvas resized (simplification: just pass it)
        const aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjection(45 * Math.PI / 180, aspect, 0.1, 100);

        this.scene.render(this.camera.getViewMatrix(), this.camera.getProjectionMatrix());
    }
}

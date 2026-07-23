import { Scene } from './ogl2.js';
import { AssetManager } from './asset-manager.js';

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

        this.scene = new Scene(this.gl);
        this.assets = new AssetManager();
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
    }

    render() {
        // Clear the color buffer using the color set by gl.clearColor()
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.scene.render();
    }
}

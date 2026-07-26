export class Texture {
    constructor(gl, url) {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.isReady = false;
        this.promise = this._load(url);
    }

    _load(url) {
        return new Promise((resolve, reject) => {
            const gl = this.gl;
            const image = new Image();
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                this.isReady = true;
                resolve();
            };
            image.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
            image.src = url;
        });
    }

    bind(unit = 0) {
        if (!this.isReady) return;
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    }
}

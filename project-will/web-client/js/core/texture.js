export class Texture {
    constructor(engine, url, preferred_texture_unit) {
        this.engine = engine;
        this.texture = engine.gl.createTexture();
        this.isReady = false;
        this._load(url);
        this.preferred_texture_unit = preferred_texture_unit ?? null;
    }

    _load(url) {
        const gl = this.engine.gl;
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);//gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);//gl.LINEAR);
            this.isReady = true;
        };
        image.src = url;
    }

    bind(unit) {
        if (!this.isReady) return;
        unit = unit ?? this.preferred_texture_unit;
        this.engine.gl.activeTexture(this.engine.gl.TEXTURE0 + unit);
        this.engine.gl.bindTexture(this.engine.gl.TEXTURE_2D, this.texture);
    }
}
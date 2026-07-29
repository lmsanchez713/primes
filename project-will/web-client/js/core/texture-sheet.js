export class TextureSheet {
    constructor(texture, faceWidth, faceHeight) {
        this.texture = texture;
        this.faceWidth = faceWidth;
        this.faceHeight = faceHeight;
    }

    getFaceRect(faceId) {
        const cols = this.texture.width / this.faceWidth;
        const rows = this.texture.height / this.faceHeight;

        const col = faceId % cols;
        const row = Math.floor(faceId / cols);

        const u = col * this.faceWidth / this.texture.width;
        const v = row * this.faceHeight / this.texture.height;
        const w = this.faceWidth / this.texture.width;
        const h = this.faceHeight / this.texture.height;

        return { u, v, w, h };
    }
}

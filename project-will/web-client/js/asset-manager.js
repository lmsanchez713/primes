import { Texture } from './ogl2.js';

export class AssetManager {
    constructor() {
        this.textures = new Map();
        this._totalRequested = 0;
        this._loadedCount = 0;
    }

    /**
     * Loads a texture and tracks its progress.
     * @param {WebGL2RenderingContext} gl 
     * @param {string} url 
     * @returns {Promise<Texture>}
     */
    async loadTexture(gl, url) {
        if (this.textures.has(url)) {
            // Return the existing texture's promise to ensure we don't duplicate loading
            return this.textures.get(url).promise;
        }

        this._totalRequested++;
        const texture = new Texture(gl, url);
        this.textures.set(url, texture);

        try {
            await texture.promise;
            this._loadedCount++;
        } catch (e) {
            console.error(`AssetManager: Failed to load texture ${url}`, e);
            // We increment loadedCount even on error so progress can reach 100%
            this._loadedCount++;
        }

        return texture;
    }

    /**
     * Returns a value from 0 to 1 representing the loading progress.
     */
    getProgress() {
        if (this._totalRequested === 0) return 1;
        return this._loadedCount / this._totalRequested;
    }

    /**
     * Checks if all requested assets are loaded.
     */
    isAllLoaded() {
        return this.getProgress() >= 1 && this._totalRequested > 0;
    }
}

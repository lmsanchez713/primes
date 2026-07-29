export class Sprite {
    constructor(textureSheet) {
        this.textureSheet = textureSheet;
        this.states = new Map(); // name -> { frames: [], duration: number }
        this.currentState = null;
        this.currentFrameIndex = 0;
        this.timer = 0;
    }

    addState(name, faceIds, duration = 1.0) {
        this.states.set(name, { frames: faceIds, duration: duration });
        if (this.currentState === null) {
            this.currentState = name;
        }
    }

    setState(name) {
        if (this.currentState === name) return;
        if (this.states.has(name)) {
            this.currentState = name;
            this.currentFrameIndex = 0;
            this.timer = 0;
        }
    }

    update(deltaTime) {
        const state = this.states.get(this.currentState);
        if (!state) return;

        this.timer += deltaTime;
        if (this.timer >= state.duration) {
            this.timer = 0;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % state.frames.length;
        }
    }

    getUVRect() {
        const state = this.states.get(this.currentState);
        if (!state || state.frames.length === 0) {
            return { u: 0, v: 0, w: 1, h: 1 };
        }
        const faceId = state.frames[this.currentFrameIndex];
        return this.textureSheet.getFaceRect(faceId);
    }
}

import { Mat4, Vec3 } from './math.js';

export class Camera {
    constructor() {
        this.position = new Vec3(0, 0, 5);
        this.target = new Vec3(0, 0, 0);
        this.up = new Vec3(0, 1, 0);
        this.viewMatrix = new Mat4();
        this.projectionMatrix = new Mat4();
    }

    updateView() {
        Mat4.lookAt(this.position, this.target, this.up, this.viewMatrix);
    }

    updateProjection(fovy, aspect, near, far) {
        Mat4.perspective(fovy, aspect, near, far, this.projectionMatrix);
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }
}

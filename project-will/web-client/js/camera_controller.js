import { Vec3 } from './math.js';

export class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.moveSpeed = 0.1;
        this.lookSpeed = 0.002;
        this.distance = 5;
        
        // Focus point (the target the camera orbits around)
        this.focus = new Vec3(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0;

        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;

        // Input state
        this.keys = {};

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.mouseDeltaX = e.movementX;
                this.mouseDeltaY = e.movementY;
            }
        });

        window.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
    }

    update() {
        // 1. Handle Rotation (Mouse)
        this.yaw -= this.mouseDeltaX * this.lookSpeed;
        this.pitch -= this.mouseDeltaY * this.lookSpeed;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;

        // Clamp pitch to avoid gimbal lock / flipping
        const limit = Math.PI / 2 - 0.1;
        if (this.pitch > limit) this.pitch = limit;
        if (this.pitch < -limit) this.pitch = -limit;

        // 2. Handle Movement (WASD) - moving the focus point
        const forwardDir = this._getForwardVector();
        const rightDir = this._getRightVector();

        if (this.keys['KeyW']) this._moveFocus(forwardDir, this.moveSpeed);
        if (this.keys['KeyS']) this._moveFocus(forwardDir, -this.moveSpeed);
        if (this.keys['KeyA']) this._moveFocus(rightDir, -this.moveSpeed);
        if (this.keys['KeyD']) this._moveFocus(rightDir, this.moveSpeed);

        // 3. Update Camera Position based on focus and rotation (spherical coordinates)
        const x = this.distance * Math.cos(this.pitch) * Math.sin(this.yaw);
        const y = this.distance * Math.sin(this.pitch);
        const z = this.distance * Math.cos(this.pitch) * Math.cos(this.yaw);

        this.camera.position.x = this.focus.x + x;
        this.camera.position.y = this.focus.y + y;
        this.camera.position.z = this.focus.z + z;
        
        this.camera.target.x = this.focus.x;
        this.camera.target.y = this.focus.y;
        this.camera.target.z = this.focus.z;

        // Update the camera's view matrix
        this.camera.updateView();
    }

    _moveFocus(direction, amount) {
        this.focus.x += direction.x * amount;
        this.focus.y += direction.y * amount;
        this.focus.z += direction.z * amount;
    }

    _getForwardVector() {
        // Vector from camera position to target (in current orientation)
        const dx = this.camera.target.x - this.camera.position.x;
        const dy = this.camera.target.y - this.camera.position.y;
        const dz = this.camera.target.z - this.camera.position.z;
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        return { x: dx/len, y: dy/len, z: dz/len };
    }

    _getRightVector() {
        // Right vector is cross product of up (0,1,0) and forward.
        const f = this._getForwardVector();
        const up = { x: 0, y: 1, z: 0 };
        // Cross(up, f) -> wait, let's check order for right hand rule.
        // If forward is -Z and up is +Y, cross(Up, Forward) should be X?
        // Let's do it manually:
        const rx = up.y * f.z - up.z * f.y;
        const ry = up.z * f.x - up.x * f.z;
        const rz = up.x * f.y - up.y * f.x;
        const len = Math.sqrt(rx*rx + ry*ry + rz*rz);
        return { x: rx/len, y: ry/len, z: rz/len };
    }
}

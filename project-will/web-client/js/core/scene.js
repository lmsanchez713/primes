import { Primitive } from '/js/primitive.js';
import { Mat4, Vec3 } from '/js/math.js';

export class Primitive_Camera {
    constructor(engine, parameters) {
        this.engine = engine;
        const view_parameters = parameters.view ?? {};
        this.view = {
            position: view_parameters.position ?? new Vec3(0.0, 0.0, 1.0),
            target: view_parameters.target ?? new Vec3(0.0, 0.0, 0.0),
            up: view_parameters.up ?? new Vec3(0.0, 1.0, 0.0)
        };
        this.mode = '0';
        if (parameters.perspective) {
            this.perspective = {
                fovy: parameters.perspective.fovy ?? 45 * Math.PI / 180,
                aspect: parameters.perspective.aspect ?? this.engine.canvas.width / this.engine.canvas.height,
                near: parameters.perspective.near ?? 0.1,
                far: parameters.perspective.far ?? 100.0
            };
            this.mode = 'p';
        }
        if (parameters.orthogonal) {
            let x_factor = 1.0, y_factor = 1.0;
            //if (engine.canvas.width > engine.canvas.height)
            //    x_factor = engine.canvas.height / engine.canvas.width, y_factor = 1.0;
            //else
            //    x_factor = 1.0, y_factor = engine.canvas.width / engine.canvas.height;
            this.orthogonal = {
                left: parameters.orthogonal.left ?? -x_factor,
                right: parameters.orthogonal.right ?? x_factor,
                bottom: parameters.orthogonal.bottom ?? -y_factor,
                top: parameters.orthogonal.top ?? y_factor,
                near: parameters.orthogonal.near ?? 0.1,
                far: parameters.orthogonal.far ?? 100.0
            };
            this.mode = 'o';
        }
        this.view_matrix = new Mat4(), this.projection_matrix = new Mat4(), this.view_projection_matrix = new Mat4();
        this.update_matrices();
    }
    update_view_and_projection() {
        Mat4.lookAt(this.view.position, this.view.target, this.view.up, this.view_matrix);
        if (this.mode === 'p') {
            this.perspective.aspect = this.engine.canvas.width / this.engine.canvas.height;
            Mat4.perspective(this.perspective.fovy, this.perspective.aspect,
                this.perspective.near, this.perspective.far, this.projection_matrix);
        }
        else if (this.mode === 'o') {
            Mat4.ortho(this.orthogonal.left, this.orthogonal.right, this.orthogonal.bottom,
                this.orthogonal.top, this.orthogonal.near, this.orthogonal.far, this.projection_matrix);
        }
    }
    update_matrices() {
        this.update_view_and_projection();
        Mat4.multiply(this.projection_matrix, this.view_matrix, this.view_projection_matrix);
    }
    /**
 * Rotate the camera around its target using the accumulated mouse deltas,
 * then reset the deltas (consuming them).
 * @param {number} sensitivity - radians of rotation per pixel (default ~0.0025)
 * @returns {Primitive_Camera} this
 */
    process_input(sensitivity = 0.0025) {
        const dx = this.mouse_delta_x ?? 0;
        const dy = this.mouse_delta_y ?? 0;
        this.mouse_delta_x = 0;   // consume
        this.mouse_delta_y = 0;
        if (dx !== 0 || dy !== 0) {

            // offset from target to eye, in spherical coords
            const ox = this.view.position.x - this.view.target.x;
            const oy = this.view.position.y - this.view.target.y;
            const oz = this.view.position.z - this.view.target.z;
            const radius = Math.sqrt(ox * ox + oy * oy + oz * oz);
            if (radius >= 1e-8) {

                let phi = Math.acos(Math.max(-1, Math.min(1, oy / radius))); // polar angle from +Y
                let theta = Math.atan2(oz, ox);                               // azimuth around Y

                theta += dx * sensitivity;      // yaw
                phi -= dy * sensitivity;        // pitch (mouse up -> look up)
                phi = Math.max(0.05, Math.min(Math.PI - 0.05, phi)); // clamp to avoid flipping over the poles

                this.view.position.x = this.view.target.x + radius * Math.sin(phi) * Math.cos(theta);
                this.view.position.y = this.view.target.y + radius * Math.cos(phi);
                this.view.position.z = this.view.target.z + radius * Math.sin(phi) * Math.sin(theta);
            }
        }

        this.update_matrices();
        return this;
    }
}

export class Primitive_Scene extends Primitive {
    constructor(engine, parameters) {
        super(engine, parameters);
        this.cameras = [];
        if (parameters.cameras) {
            for (const camera of parameters.cameras) this.cameras.push(camera);
        }
        this.model_matrix = parameters.model_matrix ?? new Mat4();
    }
}
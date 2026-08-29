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
}

export class Primitive_Scene {
    constructor() {
        //
    }
}